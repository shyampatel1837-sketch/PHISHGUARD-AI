import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Scanner from './pages/Scanner'
import History from './pages/History'
import Analytics from './pages/Analytics'
import ModelInsights from './pages/ModelInsights'
import About from './pages/About'

export default function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/"         element={<Dashboard />}     />
          <Route path="/scanner"  element={<Scanner />}       />
          <Route path="/history"  element={<History />}       />
          <Route path="/analytics" element={<Analytics />}    />
          <Route path="/model"    element={<ModelInsights />}  />
          <Route path="/about"    element={<About />}          />
          {/* Fallback — redirect unknown routes to dashboard */}
          <Route path="*"         element={<Dashboard />}     />
        </Routes>
      </main>
    </div>
  )
}
