import { Link } from 'react-router-dom'
import { parseAlphaTexMeta } from '../utils/parseAlphaTex'

const rawModules = import.meta.glob('../data/tabs/*.alphatex', { query: '?raw', import: 'default', eager: true })

const tabs = Object.entries(rawModules)
  .map(([path, raw]) => {
    const slug = path.match(/\/([^/]+)\.alphatex$/)[1]
    const meta = parseAlphaTexMeta(raw)
    return { slug, ...meta }
  })
  .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))

const DIFFICULTY_COLOR = {
  Beginner: '#4caf50',
  Intermediate: '#ff9800',
  Advanced: '#f44336',
}

export default function Guitar() {
  return (
    <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>Guitar Tabs</h1>
      <p style={{ color: '#666', marginBottom: '1.75rem' }}>
        Rendered with alphaTab — grab a guitar and play along.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {tabs.map(({ slug, title, artist, difficulty, key, tempo }) => (
          <li key={slug} style={{
            padding: '0.85rem 0',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div>
              <Link to={`/guitar/${slug}`} style={{ fontWeight: 500, fontSize: '1rem' }}>
                {title}
              </Link>
              {artist && (
                <span style={{ color: '#888', fontSize: '0.85rem', marginLeft: '0.5rem' }}>
                  — {artist}
                </span>
              )}
              <div style={{ fontSize: '0.75rem', color: '#aaa', marginTop: '0.2rem' }}>
                {key && <span>Key of {key}</span>}
                {key && tempo && <span style={{ margin: '0 0.4rem' }}>·</span>}
                {tempo && <span>{tempo} BPM</span>}
              </div>
            </div>
            {difficulty && (
              <span style={{
                background: DIFFICULTY_COLOR[difficulty] ?? '#999',
                color: '#fff',
                padding: '0.15rem 0.55rem',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                {difficulty}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
