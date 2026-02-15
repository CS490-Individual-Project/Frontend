import { NavLink, Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>TA-NK Movies</h1>
        <nav className="app-nav" aria-label="Primary">
          <NavLink to="/index">Index</NavLink>
          <NavLink to="/customers">Customers</NavLink>
          <NavLink to="/films">Films</NavLink>
        </nav>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout
