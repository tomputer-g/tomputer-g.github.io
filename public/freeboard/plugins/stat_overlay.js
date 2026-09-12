// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ Freeboard Plugin: Stat Overlay & Fake Scalar Generator             │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function () {
    var widgetInstanceId = 0;

    // ──────────────────────────────────────────────────────────────────
    // 1. Fake Scalar Datasource Plugin
    // ──────────────────────────────────────────────────────────────────
    var fakeScalarDatasource = function (settings, updateCallback) {
        var self = this;
        var currentSettings = settings;
        var timer = null;
        var history = [];
        var currentValue = Number(currentSettings.base_value || 75);

        function getNum(val, def) {
            var n = Number(val);
            return isNaN(n) ? def : n;
        }

        function seedHistory() {
            history = [];
            var count = getNum(currentSettings.history_points, 30);
            var variance = getNum(currentSettings.variance, 1.8);
            var min = getNum(currentSettings.min_value, 50);
            var max = getNum(currentSettings.max_value, 100);
            var v = currentValue;

            for (var i = 0; i < count; i++) {
                v = Math.max(min, Math.min(max, v + (Math.random() - 0.49) * variance));
                history.push(Number(v.toFixed(1)));
            }
            currentValue = history[history.length - 1];
        }

        function tick() {
            var variance = getNum(currentSettings.variance, 1.8);
            var min = getNum(currentSettings.min_value, 50);
            var max = getNum(currentSettings.max_value, 100);

            // Realistic random walk with slight mean reversion toward base_value
            var base = getNum(currentSettings.base_value, 75);
            var pull = (base - currentValue) * 0.05;
            var delta = (Math.random() - 0.48) * variance + pull;

            currentValue = Math.max(min, Math.min(max, currentValue + delta));
            currentValue = Number(currentValue.toFixed(1));

            if (history.length >= getNum(currentSettings.history_points, 30)) {
                history.shift();
            }
            history.push(currentValue);

            updateCallback({
                value: currentValue,
                history: history.slice(),
                min: Math.min.apply(null, history),
                max: Math.max.apply(null, history),
                timestamp: Date.now()
            });
        }

        function start() {
            if (timer) clearInterval(timer);
            var sec = Math.max(0.5, getNum(currentSettings.refresh_interval, 2));
            timer = setInterval(tick, sec * 1000);
        }

        seedHistory();
        tick();
        start();

        self.updateNow = function () {
            tick();
        };

        self.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            start();
        };

        self.onDispose = function () {
            if (timer) {
                clearInterval(timer);
                timer = null;
            }
        };
    };

    freeboard.loadDatasourcePlugin({
        type_name: "fake_scalar",
        display_name: "Fake Scalar Generator",
        description: "Simulates a continuous real-time metric stream with historical drift (useful for testing graphs and screen metrics).",
        settings: [
            {
                name: "base_value",
                display_name: "Base Value",
                type: "number",
                default_value: 75
            },
            {
                name: "variance",
                display_name: "Max Step Variance",
                type: "number",
                default_value: 1.8
            },
            {
                name: "min_value",
                display_name: "Min Value",
                type: "number",
                default_value: 50
            },
            {
                name: "max_value",
                display_name: "Max Value",
                type: "number",
                default_value: 100
            },
            {
                name: "history_points",
                display_name: "History Length",
                type: "number",
                default_value: 30
            },
            {
                name: "refresh_interval",
                display_name: "Refresh Every (Seconds)",
                type: "number",
                default_value: 2
            }
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new fakeScalarDatasource(settings, updateCallback));
        }
    });

    // ──────────────────────────────────────────────────────────────────
    // 2. Number with Background Graph Overlay Widget Plugin
    // ──────────────────────────────────────────────────────────────────
    var statOverlayWidget = function (settings) {
        var self = this;
        var currentSettings = settings;
        var uid = "stat_overlay_" + (++widgetInstanceId);

        var history = [];
        var maxHistory = Number(currentSettings.history_points || 30);
        var currentScalar = null;

        var container = $('<div class="stat-overlay-card" style="position:relative; width:100%; height:100%; overflow:hidden; box-sizing:border-box; background:#1b1b1b; border-radius:4px;"></div>');
        var graphContainer = $('<div style="position:absolute; inset:0; z-index:1; pointer-events:none; opacity:0.9;"></div>');
        var textContainer = $('<div style="position:relative; z-index:2; padding:10px 14px; height:100%; box-sizing:border-box; display:flex; flex-direction:column; justify-content:space-between; pointer-events:none;"></div>');

        var titleEl = $('<div style="font-size:11px; text-transform:uppercase; color:#8e8e93; letter-spacing:1px; font-weight:600; text-shadow:0 1px 4px rgba(0,0,0,0.8);"></div>');
        var valueRow = $('<div style="display:flex; align-items:baseline; margin:4px 0;"></div>');
        var valueEl = $('<div style="font-size:48px; font-weight:800; color:#ffffff; font-family:-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; line-height:1; text-shadow:0 2px 10px rgba(0,0,0,0.9);">--</div>');
        var unitsEl = $('<div style="font-size:18px; font-weight:600; margin-left:8px; text-shadow:0 1px 4px rgba(0,0,0,0.8);"></div>');
        var footerEl = $('<div style="display:flex; justify-content:space-between; font-size:10px; color:#777; font-family:monospace; text-shadow:0 1px 3px #000;"></div>');

        valueRow.append(valueEl).append(unitsEl);
        textContainer.append(titleEl).append(valueRow).append(footerEl);
        container.append(graphContainer).append(textContainer);

        function getColor() {
            return currentSettings.color || "#FF9900";
        }

        function renderSvg() {
            if (!history || history.length < 2) {
                graphContainer.empty();
                return;
            }

            var color = getColor();
            var min = Math.min.apply(null, history);
            var max = Math.max.apply(null, history);
            var range = (max - min) === 0 ? 1 : (max - min);

            // 15% vertical padding top and bottom so lines don't hit edge
            var pad = range * 0.15;
            var adjMin = min - pad;
            var adjRange = range + (pad * 2);

            var coords = [];
            for (var i = 0; i < history.length; i++) {
                var x = ((i / (history.length - 1)) * 100).toFixed(1);
                var norm = (history[i] - adjMin) / adjRange;
                var y = (95 - norm * 80).toFixed(1);
                coords.push(x + "," + y);
            }

            var linePath = "M " + coords.join(" L ");
            var areaPath = "M 0,100 L " + coords.join(" L ") + " L 100,100 Z";
            var gradId = "grad_" + uid;

            var svgHtml =
                '<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="width:100%; height:100%; display:block;">' +
                '  <defs>' +
                '    <linearGradient id="' + gradId + '" x1="0" y1="0" x2="0" y2="1">' +
                '      <stop offset="0%" stop-color="' + color + '" stop-opacity="0.4" />' +
                '      <stop offset="100%" stop-color="' + color + '" stop-opacity="0.02" />' +
                '    </linearGradient>' +
                '  </defs>' +
                '  <path d="' + areaPath + '" fill="url(#' + gradId + ')" />' +
                '  <path d="' + linePath + '" fill="none" stroke="' + color + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />' +
                '</svg>';

            graphContainer.html(svgHtml);

            if (currentSettings.show_range !== false) {
                footerEl.html(
                    '<span>MIN: ' + min.toFixed(1) + '</span>' +
                    '<span>MAX: ' + max.toFixed(1) + '</span>'
                );
            } else {
                footerEl.empty();
            }
        }

        function updateLabels() {
            titleEl.text(currentSettings.title || "");
            unitsEl.text(currentSettings.units || "").css("color", getColor());
        }

        self.render = function (element) {
            $(element).empty().append(container);
            updateLabels();
            renderSvg();
        };

        self.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            maxHistory = Number(currentSettings.history_points || 30);
            updateLabels();
            renderSvg();
        };

        self.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName !== "value") return;
            if (newValue === undefined || newValue === null) return;

            var scalar;
            var incomingHistory = null;

            if (typeof newValue === "object") {
                if (newValue.value !== undefined) scalar = newValue.value;
                if (Array.isArray(newValue.history)) incomingHistory = newValue.history;
            } else {
                scalar = newValue;
            }

            var numVal = Number(scalar);
            if (!isNaN(numVal)) {
                currentScalar = numVal;
                valueEl.text(numVal.toFixed(1));

                if (incomingHistory && incomingHistory.length > 1) {
                    history = incomingHistory.slice();
                } else {
                    if (history.length === 0) {
                        // Pre-seed a realistic historical wave around the initial value
                        for (var i = 0; i < maxHistory; i++) {
                            var pseudo = numVal + (Math.sin(i / 3) * 1.5) + (Math.random() - 0.5) * 0.5;
                            history.push(Number(pseudo.toFixed(1)));
                        }
                    }
                    history.push(numVal);
                    if (history.length > maxHistory) {
                        history.shift();
                    }
                }
                renderSvg();
            } else {
                valueEl.text(String(scalar));
            }
        };

        self.onSizeChanged = function () {
            renderSvg();
        };

        self.onDispose = function () {
            history = [];
        };

        self.getHeight = function () {
            return Number(currentSettings.height || 2);
        };
    };

    freeboard.loadWidgetPlugin({
        type_name: "stat_overlay",
        display_name: "Number with Graph Overlay",
        description: "Displays a large real-time scalar with an integrated area graph history background.",
        fill_size: true,
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text",
                default_value: "Metric"
            },
            {
                name: "value",
                display_name: "Value (or {value, history})",
                type: "calculated"
            },
            {
                name: "units",
                display_name: "Units",
                type: "text",
                default_value: ""
            },
            {
                name: "color",
                display_name: "Graph Accent Color",
                type: "option",
                default_value: "#FF9900",
                options: [
                    { name: "Amber Orange", value: "#FF9900" },
                    { name: "Cyan Teal", value: "#13F7F9" },
                    { name: "Emerald Green", value: "#28DE28" },
                    { name: "Vibrant Purple", value: "#CA3CB8" },
                    { name: "Coral Red", value: "#FF6B6B" },
                    { name: "Sky Blue", value: "#3B82F6" }
                ]
            },
            {
                name: "history_points",
                display_name: "History Points in Graph",
                type: "number",
                default_value: 30
            },
            {
                name: "show_range",
                display_name: "Show Min/Max Footer",
                type: "boolean",
                default_value: true
            },
            {
                name: "height",
                display_name: "Height Blocks",
                type: "number",
                default_value: 2
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new statOverlayWidget(settings));
        }
    });

}());
