import { useState, useEffect } from 'react'

const BLOCKS = 48 // 30-min slots per day

const DEFAULT_CATEGORIES = [
  { id: 'sleep',    label: 'Sleep',    color: '#6366f1', deletable: false },
  { id: 'work',     label: 'Work',     color: '#3b82f6', deletable: false },
  { id: 'food',     label: 'Food',     color: '#f97316', deletable: false },
  { id: 'exercise', label: 'Exercise', color: '#22c55e', deletable: false },
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
  border3hr:  '#4b5563',
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

function formatHour(h) {
  if (h === 0)  return '12a'
  if (h < 12)  return `${h}a`
  if (h === 12) return '12p'
  return `${h - 12}p`
}

function blockLabel(idx) {
  const h = Math.floor(idx / 2)
  const m = idx % 2 === 0 ? '00' : '30'
  const label = h === 0 ? '12' : h <= 12 ? `${h}` : `${h - 12}`
  const suffix = h < 12 ? 'a' : 'p'
  return `${label}:${m}${suffix}`
}

// ── Day Calendar ──────────────────────────────────────────────────────────────

function DayCalendar({ blocks, onBlocksChange, categories, activeCatId }) {
  const [isDragging, setIsDragging] = useState(false)
  const [paintValue, setPaintValue] = useState(null)
  const [hoveredIdx, setHoveredIdx] = useState(null)

  useEffect(() => {
    const stop = () => setIsDragging(false)
    window.addEventListener('mouseup', stop)
    return () => window.removeEventListener('mouseup', stop)
  }, [])

  const paint = (idx, value) => {
    onBlocksChange(prev => {
      const next = [...prev]
      next[idx] = value
      return next
    })
  }

  const handleMouseDown = (idx, e) => {
    e.preventDefault()
    const value = blocks[idx] === activeCatId ? null : activeCatId
    setPaintValue(value)
    setIsDragging(true)
    paint(idx, value)
  }

  const handleMouseEnter = (idx) => {
    setHoveredIdx(idx)
    if (isDragging) paint(idx, paintValue)
  }

  const hovCat = hoveredIdx !== null && blocks[hoveredIdx]
    ? categories.find(c => c.id === blocks[hoveredIdx])
    : null

  return (
    <div style={{ marginBottom: '2.25rem', userSelect: 'none' }}>
      {/* Hour labels — 24 cells, each spans 2 blocks */}
      <div style={{ display: 'flex', marginBottom: 3 }}>
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} style={{ flex: 1, fontSize: 9, color: DK.textMut, textAlign: 'left', paddingLeft: 1 }}>
            {h % 3 === 0 ? formatHour(h) : ''}
          </div>
        ))}
      </div>

      {/* 48 blocks */}
      <div
        style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', border: `1px solid ${DK.border}` }}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {blocks.map((catId, i) => {
          const cat = catId ? categories.find(c => c.id === catId) : null
          const is3hr  = i > 0 && i % 6 === 0
          const is1hr  = i > 0 && i % 2 === 0 && !is3hr
          return (
            <div
              key={i}
              onMouseDown={e => handleMouseDown(i, e)}
              onMouseEnter={() => handleMouseEnter(i)}
              style={{
                flex: 1,
                height: 44,
                background: cat ? cat.color : DK.surface,
                borderLeft: is3hr
                  ? `2px solid ${DK.border3hr}`
                  : is1hr
                    ? `1px solid ${DK.border}`
                    : 'none',
                cursor: 'crosshair',
                opacity: hoveredIdx === i ? 0.75 : 1,
              }}
            />
          )
        })}
      </div>

      {/* Hover info */}
      <div style={{ height: 18, marginTop: 4, fontSize: 11, color: DK.textSec }}>
        {hoveredIdx !== null && (
          <>
            <span style={{ color: DK.textMut }}>{blockLabel(hoveredIdx)} – {blockLabel(hoveredIdx + 1)}</span>
            <span style={{ margin: '0 6px', color: DK.border }}>·</span>
            {hovCat
              ? <span style={{ color: hovCat.color, fontWeight: 600 }}>{hovCat.label}</span>
              : <span style={{ color: DK.textMut }}>unassigned</span>
            }
          </>
        )}
      </div>
    </div>
  )
}

// ── Pie Chart ─────────────────────────────────────────────────────────────────

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
          const expandR = hovered === id ? r + 10 : r
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
          position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)',
          background: hoveredSlice.color, color: '#fff',
          padding: '4px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600,
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          {hoveredSlice.label} — {hoveredSlice.hoursDay.toFixed(1)}h/day · {hoveredSlice.hoursWeek.toFixed(1)}h/wk
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TimeMan() {
  const [categories,  setCategories]  = useState(DEFAULT_CATEGORIES)
  const [newLabel,    setNewLabel]    = useState('')
  const [hovered,     setHovered]     = useState(null)
  const [blocks,      setBlocks]      = useState(() => new Array(BLOCKS).fill(null))
  const [activeCatId, setActiveCatId] = useState(DEFAULT_CATEGORIES[0].id)

  // Derive hours from block counts
  const blockCounts = {}
  for (const b of blocks) {
    if (b) blockCounts[b] = (blockCounts[b] || 0) + 1
  }
  const hoursDay  = id => (blockCounts[id] || 0) * 0.5
  const hoursWeek = id => hoursDay(id) * 7

  const assignedBlocks   = blocks.filter(Boolean).length
  const unassignedBlocks = BLOCKS - assignedBlocks

  const slices = [
    ...categories
      .filter(c => blockCounts[c.id])
      .map(c => ({
        id: c.id, color: c.color, label: c.label,
        angle: (blockCounts[c.id] / BLOCKS) * 360,
        hoursDay: hoursDay(c.id), hoursWeek: hoursWeek(c.id),
      })),
    ...(unassignedBlocks > 0 ? [{
      id: '__rem__', color: DK.unalloc, label: 'Unassigned',
      angle: (unassignedBlocks / BLOCKS) * 360,
      hoursDay: unassignedBlocks * 0.5, hoursWeek: unassignedBlocks * 0.5 * 7,
    }] : []),
  ]

  const sortedCategories = [
    ...categories.map(c => ({ ...c, hoursDay: hoursDay(c.id), hoursWeek: hoursWeek(c.id) })),
    ...(unassignedBlocks > 0 ? [{
      id: '__rem__', label: 'Unassigned', color: DK.unalloc,
      hoursDay: unassignedBlocks * 0.5, hoursWeek: unassignedBlocks * 0.5 * 7,
      deletable: false,
    }] : []),
  ].sort((a, b) => b.hoursDay - a.hoursDay)

  const addCategory = () => {
    const label = newLabel.trim()
    if (!label) return
    const color = nextColor(categories.map(c => c.color))
    setCategories(cats => [
      ...cats,
      { id: `custom_${Date.now()}`, label, color, deletable: true },
    ])
    setNewLabel('')
  }

  const deleteCategory = (id) => {
    setCategories(cats => cats.filter(c => c.id !== id))
    setBlocks(prev => prev.map(b => b === id ? null : b))
    if (activeCatId === id) setActiveCatId(DEFAULT_CATEGORIES[0].id)
  }

  return (
    <div style={{ minHeight: '100vh', background: DK.bg, color: DK.textPri, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2.5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.25rem', fontSize: '1.75rem', color: DK.textPri }}>Time Management</h1>
        <p style={{ color: DK.textMut, marginTop: 0, marginBottom: '2.5rem' }}>168 hours in a week — how do you spend yours?</p>

        <div style={{ display: 'flex', gap: '3.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* ── Pie chart ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', paddingBottom: 52 }}>
            <PieChart slices={slices} hovered={hovered} onHover={setHovered} />
            <div style={{ marginTop: 8, fontSize: 13, color: DK.textMut }}>
              {(assignedBlocks * 0.5).toFixed(1)} / 24 hrs scheduled today
            </div>
          </div>

          {/* ── Right column ── */}
          <div style={{ flex: 1, minWidth: 340 }}>

            {/* ── Day schedule ── */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: '0.6rem' }}>
              <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: DK.textMut, margin: 0 }}>
                Day Schedule
              </h2>
              <span style={{ fontSize: 11, color: DK.textMut }}>
                — painting with{' '}
                <span style={{ color: (categories.find(c => c.id === activeCatId) || {}).color, fontWeight: 700 }}>
                  {(categories.find(c => c.id === activeCatId) || {}).label}
                </span>
              </span>
              <button
                onClick={() => setBlocks(new Array(BLOCKS).fill(null))}
                style={{ marginLeft: 'auto', background: 'none', border: `1px solid ${DK.border}`, borderRadius: 4, color: DK.textMut, fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}
              >
                clear
              </button>
            </div>
            <DayCalendar
              blocks={blocks}
              onBlocksChange={setBlocks}
              categories={categories}
              activeCatId={activeCatId}
            />

            {/* ── Categories (sorted by hours, with inline stats) ── */}
            <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: DK.textMut, marginBottom: '0.5rem', marginTop: 0 }}>
              Categories
            </h2>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, paddingRight: 10, marginBottom: '0.3rem' }}>
              <span style={{ fontSize: 10, color: DK.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 52, textAlign: 'right' }}>h/day</span>
              <span style={{ fontSize: 10, color: DK.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 52, textAlign: 'right' }}>h/week</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.75rem' }}>
              {sortedCategories.map(c => {
                const isSelectable = c.id !== '__rem__'
                const isActive = activeCatId === c.id
                return (
                  <div
                    key={c.id}
                    onClick={() => isSelectable && setActiveCatId(c.id)}
                    onMouseEnter={() => setHovered(c.id)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 10px',
                      borderRadius: 6,
                      border: `1px solid ${isActive ? c.color : hovered === c.id ? DK.border : 'transparent'}`,
                      background: isActive ? `${c.color}18` : hovered === c.id ? DK.surfaceHov : 'transparent',
                      cursor: isSelectable ? 'pointer' : 'default',
                      transition: 'border-color 0.1s, background 0.1s',
                    }}
                  >
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: c.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, flex: 1, color: isActive ? DK.textPri : DK.textSec }}>{c.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: DK.textPri, fontVariantNumeric: 'tabular-nums', minWidth: 52, textAlign: 'right' }}>
                      {c.hoursDay.toFixed(1)}
                    </span>
                    <span style={{ fontSize: 13, color: DK.textSec, fontVariantNumeric: 'tabular-nums', minWidth: 52, textAlign: 'right' }}>
                      {c.hoursWeek.toFixed(1)}
                    </span>
                    {c.deletable && (
                      <button
                        onClick={e => { e.stopPropagation(); deleteCategory(c.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: DK.textMut, fontSize: 16, lineHeight: 1, padding: '0 0 0 4px' }}
                        title="Remove category"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* ── Add category ── */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="New category name"
                style={{
                  flex: 1, padding: '7px 11px',
                  background: DK.surface, border: `1px solid ${DK.border}`,
                  borderRadius: 6, fontSize: 14, color: DK.textPri, outline: 'none',
                }}
              />
              <button
                onClick={addCategory}
                style={{ padding: '7px 18px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
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
