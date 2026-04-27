import { useState } from 'react'

const TOTAL_HOURS = 168

const DEFAULT_CATEGORIES = [
  { id: 'sleep',    label: 'Sleep',    color: '#6366f1', hours: 48, deletable: false },
  { id: 'work',     label: 'Work',     color: '#3b82f6', hours: 40, deletable: false },
  { id: 'food',     label: 'Food',     color: '#f97316', hours: 10, deletable: false },
  { id: 'exercise', label: 'Exercise', color: '#22c55e', hours:  7, deletable: false },
]

const EXTRA_COLORS = [
  '#ef4444', '#ec4899', '#14b8a6', '#f43f5e',
  '#0ea5e9', '#84cc16', '#fb923c', '#8b5cf6',
  '#06b6d4', '#d946ef', '#10b981', '#94a3b8',
]

const DK = {
  bg:         '#0f172a',
  surface:    '#1e293b',
  surfaceHov: '#253047',
  border:     '#334155',
  borderSub:  '#1e293b',
  textPri:    '#f1f5f9',
  textSec:    '#94a3b8',
  textMut:    '#64748b',
  unalloc:    '#334155',
}

function nextColor(usedColors) {
  for (const c of EXTRA_COLORS) {
    if (!usedColors.includes(c)) return c
  }
  return EXTRA_COLORS[0]
}

function polarToCartesian(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function slicePath(cx, cy, r, startDeg, endDeg) {
  const span = endDeg - startDeg
  if (span >= 359.99) {
    return [
      `M ${cx} ${cy + r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy - r}`,
      `A ${r} ${r} 0 1 1 ${cx} ${cy + r}`,
      'Z',
    ].join(' ')
  }
  const s = polarToCartesian(cx, cy, r, startDeg)
  const e = polarToCartesian(cx, cy, r, endDeg)
  const large = span > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
}

function PieChart({ slices, hovered, onHover }) {
  const cx = 150, cy = 150, r = 128

  const enriched = []
  let cum = 0
  for (const s of slices) {
    enriched.push({ ...s, startAngle: cum, endAngle: cum + s.angle })
    cum += s.angle
  }

  const hoveredSlice = enriched.find(s => s.id === hovered)

  return (
    <div style={{ position: 'relative', width: 300, flexShrink: 0 }}>
      <svg width={300} height={300} style={{ display: 'block', overflow: 'visible' }}>
        {enriched.map(({ id, color, angle, startAngle, endAngle }) => {
          if (angle < 0.01) return null
          const isHov = hovered === id
          const expandR = isHov ? r + 10 : r
          return (
            <path
              key={id}
              d={slicePath(cx, cy, expandR, startAngle, endAngle)}
              fill={color}
              stroke={DK.bg}
              strokeWidth={2}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onHover(id)}
              onMouseLeave={() => onHover(null)}
            />
          )
        })}
      </svg>
      {hoveredSlice && (
        <div style={{
          position: 'absolute',
          bottom: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          background: hoveredSlice.color,
          color: '#fff',
          padding: '4px 12px',
          borderRadius: 6,
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {hoveredSlice.label} — {hoveredSlice.hours}h/wk · {(hoveredSlice.hours / 7).toFixed(1)}h/day
        </div>
      )}
    </div>
  )
}

export default function TimeMan() {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES)
  const [newLabel, setNewLabel] = useState('')
  const [hovered, setHovered] = useState(null)

  const totalUsed = categories.reduce((s, c) => s + c.hours, 0)
  const remaining = Math.max(0, TOTAL_HOURS - totalUsed)

  const slices = [
    ...categories
      .filter(c => c.hours > 0)
      .map(c => ({ id: c.id, color: c.color, angle: (c.hours / TOTAL_HOURS) * 360, label: c.label, hours: c.hours })),
    ...(remaining > 0
      ? [{ id: '__rem__', color: DK.unalloc, angle: (remaining / TOTAL_HOURS) * 360, label: 'Unallocated', hours: remaining }]
      : []),
  ]

  const sortedForBreakdown = [
    ...categories.map(c => ({ ...c })),
    ...(remaining > 0 ? [{ id: '__rem__', label: 'Unallocated', color: DK.unalloc, hours: remaining, deletable: false }] : []),
  ].sort((a, b) => b.hours - a.hours)

  const updateHours = (id, newVal) => {
    setCategories(cats => {
      const othersTotal = cats.filter(c => c.id !== id).reduce((s, c) => s + c.hours, 0)
      const maxAllowed = TOTAL_HOURS - othersTotal
      const clamped = Math.min(Math.max(0, newVal), maxAllowed)
      return cats.map(c => c.id === id ? { ...c, hours: clamped } : c)
    })
  }

  const addCategory = () => {
    const label = newLabel.trim()
    if (!label) return
    const usedColors = categories.map(c => c.color)
    const color = nextColor(usedColors)
    setCategories(cats => [
      ...cats,
      { id: `custom_${Date.now()}`, label, color, hours: 0, deletable: true },
    ])
    setNewLabel('')
  }

  const deleteCategory = (id) => {
    setCategories(cats => cats.filter(c => c.id !== id))
  }

  const overBudget = totalUsed > TOTAL_HOURS

  return (
    <div style={{ minHeight: '100vh', background: DK.bg, color: DK.textPri, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        .timeman-slider { -webkit-appearance: none; appearance: none; background: transparent; width: 100%; cursor: pointer; }
        .timeman-slider::-webkit-slider-runnable-track { background: ${DK.border}; border-radius: 999px; height: 5px; }
        .timeman-slider::-moz-range-track { background: ${DK.border}; border-radius: 999px; height: 5px; }
        .timeman-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; border-radius: 50%; margin-top: -4.5px; background: var(--slider-color); }
        .timeman-slider::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; border: none; background: var(--slider-color); }
      `}</style>
      <div style={{ padding: '2.5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.25rem', fontSize: '1.75rem', color: DK.textPri }}>Time Management</h1>
        <p style={{ color: DK.textMut, marginTop: 0, marginBottom: '2.5rem' }}>
          168 hours in a week — how do you spend yours?
        </p>

        <div style={{ display: 'flex', gap: '3.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Pie chart ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', paddingBottom: 52 }}>
            <PieChart slices={slices} hovered={hovered} onHover={setHovered} />
            <div style={{
              marginTop: 8,
              fontSize: 13,
              color: overBudget ? '#ef4444' : DK.textMut,
              fontWeight: overBudget ? 700 : 400,
            }}>
              {totalUsed} / {TOTAL_HOURS} hrs allocated
              {overBudget && ' — over budget!'}
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ flex: 1, minWidth: 320 }}>

            {/* Breakdown sorted descending */}
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: DK.textMut, marginBottom: '0.6rem', marginTop: 0 }}>
              Breakdown
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.25rem', background: 'transparent' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${DK.border}` }}>
                  <th style={{ padding: '4px 8px', fontSize: 11, color: DK.textMut, fontWeight: 600, textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '4px 8px', fontSize: 11, color: DK.textMut, fontWeight: 600, textAlign: 'right' }}>hrs / week</th>
                  <th style={{ padding: '4px 8px', fontSize: 11, color: DK.textMut, fontWeight: 600, textAlign: 'right' }}>hrs / day</th>
                </tr>
              </thead>
              <tbody>
                {sortedForBreakdown.map(c => (
                  <tr
                    key={c.id}
                    onMouseEnter={() => setHovered(c.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      borderBottom: `1px solid ${DK.borderSub}`,
                      background: hovered === c.id ? DK.surfaceHov : 'transparent',
                      cursor: 'default',
                      transition: 'background 0.1s',
                    }}
                  >
                    <td style={{ padding: '6px 8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 11, height: 11, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                        <span style={{ fontSize: 14, color: DK.textPri }}>{c.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 14, fontWeight: 600, color: DK.textPri, fontVariantNumeric: 'tabular-nums' }}>
                      {c.hours}
                    </td>
                    <td style={{ padding: '6px 8px', textAlign: 'right', fontSize: 14, color: DK.textSec, fontVariantNumeric: 'tabular-nums' }}>
                      {(c.hours / 7).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Sliders */}
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: DK.textMut, marginBottom: '0.75rem', marginTop: 0 }}>
              Adjust
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
              {categories.map(c => {
                const othersTotal = categories.filter(x => x.id !== c.id).reduce((s, x) => s + x.hours, 0)
                const maxAllowed = TOTAL_HOURS - othersTotal
                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 600, flex: 1, color: DK.textPri }}>{c.label}</span>
                      <span style={{ fontSize: 12, color: DK.textSec, fontVariantNumeric: 'tabular-nums', minWidth: 90, textAlign: 'right' }}>
                        {c.hours}h/wk · {(c.hours / 7).toFixed(1)}h/day
                      </span>
                      {c.deletable && (
                        <button
                          onClick={() => deleteCategory(c.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: DK.textMut, fontSize: 18, lineHeight: 1,
                            padding: '0 2px', marginLeft: 2,
                          }}
                          title="Remove category"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={maxAllowed}
                      value={c.hours}
                      onChange={e => updateHours(c.id, +e.target.value)}
                      className="timeman-slider"
                      style={{ '--slider-color': c.color }}
                    />
                  </div>
                )
              })}
            </div>

            {/* Add new category */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="New category name"
                style={{
                  flex: 1,
                  padding: '7px 11px',
                  background: DK.surface,
                  border: `1px solid ${DK.border}`,
                  borderRadius: 6,
                  fontSize: 14,
                  color: DK.textPri,
                  outline: 'none',
                }}
              />
              <button
                onClick={addCategory}
                style={{
                  padding: '7px 18px',
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
