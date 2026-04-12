import { Routes, Route, NavLink } from 'react-router-dom'
import ErrorBoundary from './ErrorBoundary'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import './App.css'

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Home
        </NavLink>
        <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Login
        </NavLink>
        <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Register
        </NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/watchlist" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          Watchlist
        </NavLink>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ErrorBoundary>
                <Dashboard />
              </ErrorBoundary>
            }
          />
          <Route
            path="/watchlist"
            element={
              <ErrorBoundary>
                <Watchlist />
              </ErrorBoundary>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
