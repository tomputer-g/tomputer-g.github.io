import { useState, useEffect } from 'react'
import Header from './components/Header.jsx'
import TitleBar from './components/TitleBar.jsx'
import About from './components/About.jsx'
import Publications from './components/Publications.jsx'
import PageFooter from './components/PageFooter.jsx'

function App() {
  const [activeSection, setActiveSection] = useState('about')
  const [headerVisible, setHeaderVisible] = useState(false)

  // Remove is-preload class after window load (disables animation suppression)
  useEffect(() => {
    const remove = () => document.body.classList.remove('is-preload')
    if (document.readyState === 'complete') {
      remove()
    } else {
      window.addEventListener('load', remove)
      return () => window.removeEventListener('load', remove)
    }
  }, [])

  // Sync header-visible class on body for CSS-driven mobile panel
  useEffect(() => {
    document.body.classList.toggle('header-visible', headerVisible)
  }, [headerVisible])

  // Track which section is in view for active nav highlight
  useEffect(() => {
    const sections = document.querySelectorAll('#main section[id]')
    if (!sections.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { threshold: 0.3 },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  const handleNavClick = (e, target) => {
    e.preventDefault()
    document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
    setHeaderVisible(false)
  }

  // Close panel when clicking main content area
  const handleWrapperClick = () => {
    if (headerVisible) setHeaderVisible(false)
  }

  return (
    <>
      <TitleBar onToggle={() => setHeaderVisible((v) => !v)} />
      <Header activeSection={activeSection} onNavClick={handleNavClick} />
      <div id="wrapper" onClick={handleWrapperClick}>
        <div id="main">
          <About />
          <Publications />
        </div>
        <PageFooter />
      </div>
    </>
  )
}

export default App
