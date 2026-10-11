import React, { useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { MoonStar, SunMedium } from 'lucide-react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Scanner from './pages/Scanner'
import History from './pages/History'
import Analytics from './pages/Analytics'
import ModelInsights from './pages/ModelInsights'
import About from './pages/About'

const PAGE_TITLES = {
  '/': 'Overview',
  '/scanner': 'URL Scanner',
  '/history': 'Scan History',
  '/analytics': 'Analytics',
  '/model': 'Model Insights',
  '/about': 'About',
}

export default function App() {
  const location = useLocation()
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('phishguard-theme')
    return saved || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('phishguard-theme', theme)
  }, [theme])

  const currentTitle = useMemo(() => {
    return PAGE_TITLES[location.pathname] || 'Overview'
  }, [location.pathname])

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <header className="topbar glass">
          <div>
            <p className="topbar-eyebrow">PhishGuard AI</p>
            <h2 className="topbar-title">{currentTitle}</h2>
          </div>

          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
              <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
            </button>
          </div>
        </header>

        <div className="content-shell">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/history" element={<History />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/model" element={<ModelInsights />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

