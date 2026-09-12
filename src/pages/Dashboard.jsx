export default function Dashboard() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', background: '#111' }}>
      <iframe
        src="/freeboard/index.html"
        title="Freeboard Metrics Dashboard"
        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
      />
    </div>
  )
}
