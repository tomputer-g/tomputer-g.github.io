function Header({ activeSection, onNavClick }) {
  return (
    <section id="header">
      <header>
        <span className="image avatar">
          <img src="/images/avatar.jpg" alt="" />
        </span>
        <h1 id="logo">
          <a href="#">Ziming (Tom) Gao</a>
        </h1>
        <p>MRSD student @ CMU Robotics Institute</p>
      </header>

      <nav id="nav">
        <ul>
          <li>
            <a
              href="#about"
              className={activeSection === 'about' ? 'active' : undefined}
              onClick={(e) => onNavClick(e, '#about')}
            >
              About Me
            </a>
          </li>
          <li>
            <a
              href="#pub"
              className={activeSection === 'pub' ? 'active' : undefined}
              onClick={(e) => onNavClick(e, '#pub')}
            >
              Publications and Other Works
            </a>
          </li>
        </ul>
      </nav>

      <footer>
        <ul className="icons">
          <li>
            <a href="https://linkedin.com/in/zgao/" className="icon brands fa-linkedin">
              <span className="label">LinkedIn</span>
            </a>
          </li>
        </ul>
      </footer>
    </section>
  )
}

export default Header
