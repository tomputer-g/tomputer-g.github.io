import { useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ReactFlow,
  addEdge,
  Background,
  useNodesState,
  useEdgesState,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { parseRecipe } from '../utils/parseRecipe'

const rawModules = import.meta.glob('../data/recipes/*.md', { query: '?raw', import: 'default', eager: true })

const recipes = Object.entries(rawModules).map(([path, raw]) => {
  const slug = path.match(/\/([^/]+)\.md$/)[1]
  return { slug, ...parseRecipe(raw) }
})

const MULTIPLIERS = [0.5, 1, 1.5, 2, 3]

function scaleQty(str, multiplier) {
  const match = str.match(/^(\d+(?:\.\d+)?)(.*)$/)
  if (!match) return str
  const scaled = parseFloat(match[1]) * multiplier
  const formatted = scaled % 1 === 0
    ? scaled.toString()
    : parseFloat(scaled.toFixed(1)).toString()
  return formatted + match[2]
}

function applyMultiplier(text, multiplier) {
  return text.replace(/\[\[([^\]]+)\]\]/g, (_, qty) => {
    if (multiplier === 1) return qty
    const scaled = scaleQty(qty, multiplier)
    return `<span class="qty-scaled">*${scaled}*</span>`
  })
}

function buildLabel(rawLabel, multiplier) {
  if (!rawLabel?.includes('[[')) return rawLabel
  const parts = rawLabel.split(/\[\[([^\]]+)\]\]/)
  if (multiplier === 1) return parts.map((p, i) => i % 2 === 1 ? p : p).join('')
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1
          ? <strong key={i}><em>*{scaleQty(part, multiplier)}*</em></strong>
          : part
      )}
    </>
  )
}

const NODE_DEFAULTS = {
  style: {
    width: 220,
    lineHeight: 1.3,
    fontSize: '0.8rem',
    padding: '6px 10px',
  },
}

function RecipeFlow({ nodes: initialNodes, edges: initialEdges, onNodeClick, multiplier }) {
  const styledNodes = initialNodes.map((n) => ({
    ...NODE_DEFAULTS,
    ...n,
    style: { ...NODE_DEFAULTS.style, ...n.style },
    data: { ...n.data, label: buildLabel(n.data.label, multiplier) },
  }))
  const [nodes, , onNodesChange] = useNodesState(styledNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={(_, node) => onNodeClick(node)}
      fitView
      attributionPosition="top-right"
    >
      <Background />
    </ReactFlow>
  )
}

export default function RecipePage() {
  const { slug } = useParams()
  const [selectedId, setSelectedId] = useState(null)
  const [multiplierIdx, setMultiplierIdx] = useState(1)

  const recipe = recipes.find((r) => r.slug === slug)

  if (!recipe) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Recipe not found.</p>
        <Link to="/recipes">Back to recipes</Link>
      </div>
    )
  }

  const multiplier = MULTIPLIERS[multiplierIdx]
  const section = selectedId != null ? recipe.sections[selectedId] : null
  const processedSection = section ? applyMultiplier(section, multiplier) : null
  const selectedNode = recipe.nodes.find((n) => n.id === selectedId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <style>{`
        .qty-scaled { font-weight: bold; font-style: italic; }
        input[type="range"] { -webkit-appearance: none; appearance: none; height: 4px; background: #ccc; border-radius: 2px; outline: none; cursor: pointer; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: #555; }
        input[type="range"]::-moz-range-thumb { width: 14px; height: 14px; border-radius: 50%; background: #555; border: none; }
        input[type="range"]::-moz-range-track { height: 4px; background: #ccc; border-radius: 2px; }
      `}</style>

      <div style={{ padding: '0.75rem 1.5rem', borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <div>
          <Link to="/recipes">← Back to recipes</Link>
          <h1 style={{ margin: '0.25rem 0 0', fontSize: '1.4rem' }}>{recipe.title}</h1>
        </div>

        {recipe.scale && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.8rem', color: '#555' }}>
              Scale: <strong>{multiplier}x</strong> {recipe.scale.ingredient}
            </label>
            <input
              type="range"
              min={0}
              max={MULTIPLIERS.length - 1}
              step={1}
              value={multiplierIdx}
              onChange={(e) => setMultiplierIdx(parseInt(e.target.value))}
              style={{ width: 160 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#888', width: 160 }}>
              {MULTIPLIERS.map((m) => <span key={m}>{m}x</span>)}
            </div>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1 }}>
          <RecipeFlow
            key={multiplier}
            nodes={recipe.nodes}
            edges={recipe.edges}
            onNodeClick={(node) => setSelectedId(node.id)}
            multiplier={multiplier}
          />
        </div>

        <div style={{
          width: 320,
          overflowY: 'auto',
          padding: '1.25rem',
          borderLeft: '1px solid #e0e0e0',
          fontSize: '0.875rem',
          lineHeight: 1.5,
        }}>
          {processedSection ? (
            <>
              {selectedNode?.data?.icon && (
                <span style={{ fontSize: '2rem' }}>{selectedNode.data.icon}</span>
              )}
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                {processedSection}
              </ReactMarkdown>
            </>
          ) : (
            <p style={{ color: '#888', fontStyle: 'italic' }}>
              Click a node to see details.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
