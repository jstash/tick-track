import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { authAPI, getAuthToken } from './api/client'
import ErrorBoundary from './ErrorBoundary'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Watchlist from './pages/Watchlist'
import './App.css'

function RootRedirect() {
  return getAuthToken() ? (
    <Navigate to="/dashboard" replace />
  ) : (
    <Navigate to="/login" replace />
  )
}

function App() {
  const navigate = useNavigate()
  const isLoggedIn = Boolean(getAuthToken())

  const handleLogout = () => {
    authAPI.logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="app">
      <nav className="navbar">
        {isLoggedIn ? (
          <button type="button" className="nav-link" onClick={handleLogout}>
            Log out
          </button>
        ) : (
          <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            Log in
          </NavLink>
        )}
        {isLoggedIn && (
          <>
            <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Watchlist
            </NavLink>
            <NavLink to="/watchlist" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              Configure
            </NavLink>
          </>
        )}
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
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
