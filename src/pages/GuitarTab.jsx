import { useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { parseAlphaTexMeta } from '../utils/parseAlphaTex'

const ALPHATAB_MODULE_URL = '/alphatab/alphaTab.mjs'
const ALPHATAB_WORKER_URL = '/alphatab/alphaTab.worker.mjs'
const ALPHATAB_FONT_DIR = '/alphatab/font/'

const rawModules = import.meta.glob('../data/tabs/*.alphatex', { query: '?raw', import: 'default', eager: true })

const tabs = Object.fromEntries(
  Object.entries(rawModules).map(([path, raw]) => {
    const slug = path.match(/\/([^/]+)\.alphatex$/)[1]
    return [slug, { raw, meta: parseAlphaTexMeta(raw) }]
  })
)

function stripCommentLines(raw) {
  return raw.split('\n').filter((line) => !line.trim().startsWith('//')).join('\n')
}

// Hide import() behind Function() so Vite doesn't rewrite the URL at build time.
const externalImport = (url) => Function('u', 'return import(u)')(url)

let alphaTabPromise = null
function loadAlphaTab() {
  if (!alphaTabPromise) alphaTabPromise = externalImport(ALPHATAB_MODULE_URL)
  return alphaTabPromise
}

export default function GuitarTab() {
  const { slug } = useParams()
  const containerRef = useRef(null)
  const tab = tabs[slug]

  useEffect(() => {
    if (!tab) return
    const container = containerRef.current
    if (!container) return

    let api = null
    let stopped = false

    async function init() {
      const alphaTab = await loadAlphaTab()
      if (stopped) return

      const AlphaTabApi = alphaTab.AlphaTabApi ?? alphaTab.default?.AlphaTabApi
      if (!AlphaTabApi) throw new Error('alphaTab module did not export AlphaTabApi')

      api = new AlphaTabApi(container, {
        core: {
          tex: true,
          fontDirectory: ALPHATAB_FONT_DIR,
          scriptFile: ALPHATAB_MODULE_URL,
          workerScript: ALPHATAB_WORKER_URL,
        },
      })
      api.tex(stripCommentLines(tab.raw))
    }

    init().catch((err) => console.error('alphaTab init failed:', err))

    return () => {
      stopped = true
      try { api?.destroy() } catch (_) {}
    }
  }, [tab])

  if (!tab) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>Tab not found.</p>
        <Link to="/guitar">← Guitar tabs</Link>
      </div>
    )
  }

  const { meta } = tab

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/guitar" style={{ fontSize: '0.875rem', color: '#888', textDecoration: 'none' }}>
          ← Guitar tabs
        </Link>
        <h1 style={{ margin: '0.5rem 0 0.15rem', fontSize: '1.75rem' }}>{meta.title}</h1>
        {meta.artist && <div style={{ color: '#666', fontSize: '1rem' }}>{meta.artist}</div>}
        <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.6rem', fontSize: '0.8rem', color: '#aaa' }}>
          {meta.key && <span>Key of {meta.key}</span>}
          {meta.tempo && <span>{meta.tempo} BPM</span>}
          {meta.difficulty && <span>{meta.difficulty}</span>}
        </div>
      </div>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          border: '1px solid #ccc',
          padding: '20px',
          boxSizing: 'border-box',
          minHeight: '200px',
        }}
      />
    </div>
  )
}
