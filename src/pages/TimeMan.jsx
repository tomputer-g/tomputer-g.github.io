import { useState, useEffect, useRef } from 'react'
import savedData from '../data/timeman.json'

const BLOCKS = 48                                                   // 30-min slots per day
const DAYS   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const ROW_H  = 14                                                   // px per slot

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
    return `M ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} Z`
  }
  const s = polarToCartesian(cx, cy, r, startDeg)
  const e = polarToCartesian(cx, cy, r, endDeg)
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${span > 180 ? 1 : 0} 1 ${e.x} ${e.y} Z`
}

function formatHour(h) {
  if (h === 0)  return '12a'
  if (h < 12)  return `${h}a`
  if (h === 12) return '12p'
  return `${h - 12}p`
}

function blockLabel(idx) {
  if (idx >= BLOCKS) return '12a'
  const h = Math.floor(idx / 2)
  const m = idx % 2 === 0 ? '00' : '30'
  const label = h === 0 ? '12' : h <= 12 ? `${h}` : `${h - 12}`
  return `${label}:${m}${h < 12 ? 'a' : 'p'}`
}

// ── Week Calendar ─────────────────────────────────────────────────────────────

function WeekCalendar({ blocks, onBlocksChange, categories, activeCatId }) {
  const [dragState,   setDragState]   = useState(null)
  const [hoveredCell, setHoveredCell] = useState(null)
  const dragRef = useRef(null)

  const syncDrag = (state) => {
    dragRef.current = state
    setDragState(state)
  }

  useEffect(() => {
    const commit = () => {
      const ds = dragRef.current
      if (!ds) return
      const minDay  = Math.min(ds.startDay,  ds.currentDay)
      const maxDay  = Math.max(ds.startDay,  ds.currentDay)
      const minSlot = Math.min(ds.startSlot, ds.currentSlot)
      const maxSlot = Math.max(ds.startSlot, ds.currentSlot)
      onBlocksChange(prev => {
        const next = [...prev]
        for (let d = minDay; d <= maxDay; d++)
          for (let s = minSlot; s <= maxSlot; s++)
            next[d * BLOCKS + s] = ds.paintValue
        return next
      })
      syncDrag(null)
    }
    window.addEventListener('mouseup', commit)
    return () => window.removeEventListener('mouseup', commit)
  }, [onBlocksChange])

  const handleMouseDown = (d, s, e) => {
    e.preventDefault()
    const paintValue = blocks[d * BLOCKS + s] === activeCatId ? null : activeCatId
    syncDrag({ startDay: d, startSlot: s, currentDay: d, currentSlot: s, paintValue })
  }

  const handleMouseEnter = (d, s) => {
    setHoveredCell({ day: d, slot: s })
    if (dragRef.current) syncDrag({ ...dragRef.current, currentDay: d, currentSlot: s })
  }

  const cellCatId = (d, s) => {
    if (dragState) {
      const minDay  = Math.min(dragState.startDay,  dragState.currentDay)
      const maxDay  = Math.max(dragState.startDay,  dragState.currentDay)
      const minSlot = Math.min(dragState.startSlot, dragState.currentSlot)
      const maxSlot = Math.max(dragState.startSlot, dragState.currentSlot)
      if (d >= minDay && d <= maxDay && s >= minSlot && s <= maxSlot) return dragState.paintValue
    }
    return blocks[d * BLOCKS + s]
  }

  return (
    <div style={{ userSelect: 'none', marginBottom: '2.5rem' }}>
      {/* Day labels */}
      <div style={{ display: 'flex', paddingLeft: 44 }}>
        {DAYS.map((day, d) => (
          <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 700, color: DK.textSec, paddingBottom: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {day}
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div
        style={{ display: 'flex', height: 400, overflowY: 'auto', border: `1px solid ${DK.border}`, borderRadius: 6 }}
        onMouseLeave={() => setHoveredCell(null)}
      >
        {/* Time label column */}
        <div style={{ width: 44, flexShrink: 0, position: 'relative', height: BLOCKS * ROW_H, background: DK.bg }}>
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} style={{ position: 'absolute', top: h * 2 * ROW_H - 5, right: 6, fontSize: 9, color: DK.textMut, lineHeight: 1 }}>
              {formatHour(h)}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((_, d) => (
          <div key={d} style={{ flex: 1, borderLeft: `1px solid ${DK.border}`, height: BLOCKS * ROW_H }}>
            {Array.from({ length: BLOCKS }, (_, s) => {
              const catId = cellCatId(d, s)
              const cat   = catId ? categories.find(c => c.id === catId) : null
              const borderBottom = s % 6 === 5
                ? `1px solid ${DK.border3hr}`
                : s % 2 === 1
                  ? `1px solid ${DK.border}`
                  : `1px solid ${DK.borderSub}`
              return (
                <div
                  key={s}
                  onMouseDown={e => handleMouseDown(d, s, e)}
                  onMouseEnter={() => handleMouseEnter(d, s)}
                  style={{ height: ROW_H, background: cat ? cat.color : DK.surface, borderBottom, cursor: 'crosshair' }}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Status bar */}
      <div style={{ height: 18, marginTop: 4, fontSize: 11, color: DK.textSec }}>
        {dragState ? (() => {
          const minDay  = Math.min(dragState.startDay,  dragState.currentDay)
          const maxDay  = Math.max(dragState.startDay,  dragState.currentDay)
          const minSlot = Math.min(dragState.startSlot, dragState.currentSlot)
          const maxSlot = Math.max(dragState.startSlot, dragState.currentSlot)
          const cat = dragState.paintValue ? categories.find(c => c.id === dragState.paintValue) : null
          return <>
            <span style={{ color: DK.textMut }}>{DAYS[minDay]}–{DAYS[maxDay]}, {blockLabel(minSlot)}–{blockLabel(maxSlot + 1)}</span>
            <span style={{ margin: '0 6px', color: DK.border }}>·</span>
            {cat ? <span style={{ color: cat.color, fontWeight: 700 }}>{cat.label}</span>
                 : <span style={{ color: DK.textMut }}>erase</span>}
          </>
        })() : hoveredCell ? (() => {
          const catId = blocks[hoveredCell.day * BLOCKS + hoveredCell.slot]
          const cat   = catId ? categories.find(c => c.id === catId) : null
          return <>
            <span style={{ color: DK.textMut }}>{DAYS[hoveredCell.day]}, {blockLabel(hoveredCell.slot)}</span>
            <span style={{ margin: '0 6px', color: DK.border }}>·</span>
            {cat ? <span style={{ color: cat.color, fontWeight: 600 }}>{cat.label}</span>
                 : <span style={{ color: DK.textMut }}>unassigned</span>}
          </>
        })() : null}
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
          return (
            <path
              key={id}
              d={slicePath(cx, cy, hovered === id ? r + 10 : r, startAngle, endAngle)}
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
  const [categories,  setCategories]  = useState(() => savedData?.categories ?? DEFAULT_CATEGORIES)
  const [newLabel,    setNewLabel]    = useState('')
  const [hovered,     setHovered]     = useState(null)
  const [blocks,      setBlocks]      = useState(() => savedData?.blocks ?? new Array(DAYS.length * BLOCKS).fill(null))
  const [activeCatId, setActiveCatId] = useState(() => savedData?.activeCatId ?? DEFAULT_CATEGORIES[0].id)

  // Derive hours from block counts (each block = 0.5 hr; 7 days in grid)
  const blockCounts = {}
  for (const b of blocks) {
    if (b) blockCounts[b] = (blockCounts[b] || 0) + 1
  }
  const hoursWeek = id => (blockCounts[id] || 0) * 0.5
  const hoursDay  = id => hoursWeek(id) / 7

  const assignedBlocks   = blocks.filter(Boolean).length
  const unassignedBlocks = DAYS.length * BLOCKS - assignedBlocks

  const slices = [
    ...categories
      .filter(c => blockCounts[c.id])
      .map(c => ({
        id: c.id, color: c.color, label: c.label,
        angle: (blockCounts[c.id] / (DAYS.length * BLOCKS)) * 360,
        hoursDay: hoursDay(c.id), hoursWeek: hoursWeek(c.id),
      })),
    ...(unassignedBlocks > 0 ? [{
      id: '__rem__', color: DK.unalloc, label: 'Unassigned',
      angle: (unassignedBlocks / (DAYS.length * BLOCKS)) * 360,
      hoursDay: unassignedBlocks * 0.5 / 7, hoursWeek: unassignedBlocks * 0.5,
    }] : []),
  ]

  const sortedCategories = [
    ...categories.map(c => ({ ...c, hoursDay: hoursDay(c.id), hoursWeek: hoursWeek(c.id) })),
    ...(unassignedBlocks > 0 ? [{
      id: '__rem__', label: 'Unassigned', color: DK.unalloc, deletable: false,
      hoursDay: unassignedBlocks * 0.5 / 7, hoursWeek: unassignedBlocks * 0.5,
    }] : []),
  ].sort((a, b) => b.hoursWeek - a.hoursWeek)

  const addCategory = () => {
    const label = newLabel.trim()
    if (!label) return
    const color = nextColor(categories.map(c => c.color))
    setCategories(cats => [...cats, { id: `custom_${Date.now()}`, label, color, deletable: true }])
    setNewLabel('')
  }

  const deleteCategory = (id) => {
    setCategories(cats => cats.filter(c => c.id !== id))
    setBlocks(prev => prev.map(b => b === id ? null : b))
    if (activeCatId === id) setActiveCatId(DEFAULT_CATEGORIES[0].id)
  }

  const activeCat = categories.find(c => c.id === activeCatId)

  return (
    <div style={{ minHeight: '100vh', background: DK.bg, color: DK.textPri, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ padding: '2.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '0.25rem', fontSize: '1.75rem', color: DK.textPri }}>Time Management</h1>

        {/* ── Calendar header ── */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: '0.6rem' }}>
          <h2 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: DK.textMut, margin: 0 }}>
            Week Schedule
          </h2>
          <span style={{ fontSize: 11, color: DK.textMut }}>
            — painting with{' '}
            <span style={{ color: activeCat?.color, fontWeight: 700 }}>{activeCat?.label}</span>
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button
              onClick={() => {
                const data = JSON.stringify({ blocks, categories, activeCatId }, null, 2)
                const blob = new Blob([data], { type: 'application/json' })
                const url  = URL.createObjectURL(blob)
                const a    = document.createElement('a')
                a.href = url; a.download = 'timeman.json'; a.click()
                URL.revokeObjectURL(url)
              }}
              style={{ background: 'none', border: `1px solid ${DK.border}`, borderRadius: 4, color: DK.textMut, fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}
            >
              save
            </button>
            <label style={{ background: 'none', border: `1px solid ${DK.border}`, borderRadius: 4, color: DK.textMut, fontSize: 11, padding: '2px 8px', cursor: 'pointer', display: 'inline-block', lineHeight: '18px' }}>
              load
              <input
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  const reader = new FileReader()
                  reader.onload = ev => {
                    try {
                      const { blocks: b, categories: c, activeCatId: a } = JSON.parse(ev.target.result)
                      if (Array.isArray(b)) setBlocks(b)
                      if (Array.isArray(c)) setCategories(c)
                      if (typeof a === 'string') setActiveCatId(a)
                    } catch { /* malformed file — ignore */ }
                  }
                  reader.readAsText(file)
                  e.target.value = ''
                }}
              />
            </label>
            <button
              onClick={() => setBlocks(new Array(DAYS.length * BLOCKS).fill(null))}
              style={{ background: 'none', border: `1px solid ${DK.border}`, borderRadius: 4, color: DK.textMut, fontSize: 11, padding: '2px 8px', cursor: 'pointer' }}
            >
              clear
            </button>
          </div>
        </div>

        {/* ── Full-width week calendar ── */}
        <WeekCalendar
          blocks={blocks}
          onBlocksChange={setBlocks}
          categories={categories}
          activeCatId={activeCatId}
        />

        {/* ── Pie chart + categories ── */}
        <div style={{ display: 'flex', gap: '3.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Pie */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 52 }}>
            <PieChart slices={slices} hovered={hovered} onHover={setHovered} />
            <div style={{ marginTop: 8, fontSize: 13, color: DK.textMut }}>
              {(assignedBlocks * 0.5).toFixed(0)} / 168 hrs/wk scheduled
            </div>
          </div>

          {/* Categories */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, paddingRight: 10, marginBottom: '0.3rem' }}>
              <span style={{ fontSize: 10, color: DK.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 52, textAlign: 'right' }}>h/day</span>
              <span style={{ fontSize: 10, color: DK.textMut, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: 52, textAlign: 'right' }}>h/week</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.5rem' }}>
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
                      padding: '5px 10px', borderRadius: 6,
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
                      >×</button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Add category */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addCategory()}
                placeholder="New category name"
                style={{ flex: 1, padding: '7px 11px', background: DK.surface, border: `1px solid ${DK.border}`, borderRadius: 6, fontSize: 14, color: DK.textPri, outline: 'none' }}
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
