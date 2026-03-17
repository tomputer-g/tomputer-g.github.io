function TitleBar({ onToggle }) {
  return (
    <div id="titleBar">
      <span className="title">Tom Gao</span>
      <a
        href="#"
        className="toggle"
        onClick={(e) => {
          e.preventDefault()
          onToggle()
        }}
      >
        Toggle
      </a>
    </div>
  )
}

export default TitleBar
