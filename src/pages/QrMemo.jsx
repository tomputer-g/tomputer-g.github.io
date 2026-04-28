import { useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

const rawModules = import.meta.glob('../data/memos/*.md', { query: '?raw', import: 'default', eager: true })

const memos = {}
Object.entries(rawModules).forEach(([path, raw]) => {
  const id = path.match(/\/([^/]+)\.md$/)[1]
  memos[id] = raw
})

export default function QrMemo() {
  const { id } = useParams()
  const content = memos[id]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '0.6rem 1rem',
        borderBottom: '1px solid #e8e8e8',
        fontSize: '0.75rem',
        color: '#aaa',
        fontFamily: 'monospace',
        letterSpacing: '0.03em',
      }}>
        tomgao.net/qr/{id}
      </div>

      <div style={{
        flex: 1,
        maxWidth: 680,
        width: '100%',
        margin: '0 auto',
        padding: '1.5rem 1.25rem 3rem',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: '1rem',
        lineHeight: 1.65,
        color: '#222',
      }}>
        {content ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {content}
          </ReactMarkdown>
        ) : (
          <div style={{ paddingTop: '3rem', textAlign: 'center', color: '#888' }}>
            <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>?</p>
            <p>No memo found for <code style={{ background: '#f4f4f4', padding: '0.1em 0.4em', borderRadius: 4 }}>{id}</code></p>
          </div>
        )}
      </div>
    </div>
  )
}
