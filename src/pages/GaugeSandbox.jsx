import { useEffect, useRef } from 'react'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = src
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

export default function GaugeSandbox() {
  const containerRef = useRef(null)

  useEffect(() => {
    let stopped = false

    async function init() {
      await loadScript('https://d3js.org/d3.v7.min.js')
      await loadScript('https://unpkg.com/@patricksurry/g3/dist/g3-contrib.min.js')

      if (stopped || !containerRef.current) return

      const { g3, d3 } = window

      const containerId = 'gauge-sandbox-container'
      containerRef.current.id = containerId

      const gpumem = g3.gauge()
        .metric('gpumem').unit('MB')
        .fake(g3.forceSeries(0, 8))
        .measure(d3.scaleLinear().domain([0, 10]).range([-125, 125]))
        .append(
          g3.gaugeFace(),
          g3.axisLine(),
          g3.axisLabels(),
          g3.axisTicks(),
          g3.axisSector([8, 10]).size(5).class('g3-danger-fill'),
          g3.gaugeLabel('GPU MEM').size(12).y(-40),
          g3.gaugeLabel('GBs').size(20).y(40),
          g3.indicatePointer().shape('sword'),
        )

      const gpuutil = g3.gauge()
        .metric('gpuutil').unit('s')
        .fake(g3.forceSeries(60, 100))
        .measure(d3.scaleLinear().domain([0, 100]).range([-125, 125]))
        .append(
          g3.gaugeFace(),
          g3.axisLine(),
          g3.axisLabels(),
          g3.axisTicks(),
          g3.axisSector([80, 100]).size(5).class('g3-danger-fill'),
          g3.gaugeLabel('GPU UTIL').size(12).y(-40),
          g3.gaugeLabel('%').size(20).y(40),
          g3.indicatePointer().shape('sword'),
        )

      const p = g3.panel()
        .width(640)
        .height(320)
        .append(g3.put().x(150).y(150).append(gpumem))
        .append(g3.put().x(450).y(150).append(gpuutil))

      p.interval(500)(`#${containerId}`)
    }

    init()

    return () => {
      stopped = true
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [])

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#111' }}>
      <div ref={containerRef} />
    </div>
  )
}
