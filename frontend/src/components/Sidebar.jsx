import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, LayoutDashboard, Search, History,
  BarChart3, Cpu, Info, Menu, X, Wifi, WifiOff,
  ChevronRight,
} from 'lucide-react'
import { useHealthCheck } from '../hooks/useHealthCheck'

const NAV_ITEMS = [
  { to: '/',             icon: LayoutDashboard, label: 'Dashboard'      },
  { to: '/scanner',      icon: Search,          label: 'URL Scanner'    },
  { to: '/history',      icon: History,         label: 'Scan History'   },
  { to: '/analytics',    icon: BarChart3,        label: 'Analytics'      },
  { to: '/model',        icon: Cpu,             label: 'Model Insights' },
  { to: '/about',        icon: Info,            label: 'About'          },
]

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { online, health } = useHealthCheck()

  return (
    <>
      {/* ── Mobile toggle ──────────────────────────────────────────────────── */}
      <button
        className="mobile-menu-btn"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <motion.aside
        className={`sidebar ${mobileOpen ? 'sidebar--open' : ''}`}
        initial={false}
      >
        {/* Close btn (mobile) */}
        <button
          className="sidebar-close-btn"
          onClick={() => setMobileOpen(false)}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>

        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <Shield size={22} />
          </div>
          <div>
            <div className="sidebar-brand-name">PhishGuard</div>
            <div className="sidebar-brand-tag">AI</div>
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`
              }
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={17} />
              <span>{label}</span>
              <ChevronRight size={13} className="sidebar-nav-chevron" />
            </NavLink>
          ))}
        </nav>

        {/* System status */}
        <div className="sidebar-footer">
          <div className="sidebar-status">
            {online
              ? <Wifi size={13} color="var(--emerald)" />
              : <WifiOff size={13} color="var(--rose)" />
            }
            <span className={online ? 'sidebar-status--online' : 'sidebar-status--offline'}>
              {online ? `API v${health?.version || '—'}` : 'Backend offline'}
            </span>
          </div>
          <div className="sidebar-tagline">Detect. Analyze. Protect.</div>
        </div>
      </motion.aside>

      <style>{`
        .sidebar {
          width: var(--sidebar-width);
          height: 100vh;
          background: var(--bg-surface);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
          overflow: hidden;
          position: relative;
          z-index: 50;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 24px 20px 20px;
        }
        .sidebar-brand-icon {
          width: 40px; height: 40px;
          background: linear-gradient(135deg, #0ea5e9, #38bdf8);
          border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          color: #0c1929;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(56,189,248,.3);
        }
        .sidebar-brand-name {
          font-size: 15px; font-weight: 700;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          line-height: 1.2;
        }
        .sidebar-brand-tag {
          font-size: 10px; font-weight: 700;
          color: var(--accent);
          letter-spacing: 0.12em;
          font-family: var(--font-mono);
        }

        .sidebar-divider {
          height: 1px;
          background: var(--border);
          margin: 0 16px 12px;
        }

        .sidebar-nav {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 0 10px;
          overflow-y: auto;
        }

        .sidebar-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: var(--radius-md);
          font-size: 13.5px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all var(--transition);
          position: relative;
        }
        .sidebar-nav-item:hover {
          background: var(--accent-dim);
          color: var(--text-primary);
        }
        .sidebar-nav-item--active {
          background: var(--accent-dim);
          color: var(--accent);
          font-weight: 600;
        }
        .sidebar-nav-item--active::before {
          content: '';
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 3px; height: 60%;
          background: var(--accent);
          border-radius: 0 3px 3px 0;
        }
        .sidebar-nav-chevron {
          margin-left: auto;
          opacity: 0;
          transition: opacity var(--transition);
        }
        .sidebar-nav-item:hover .sidebar-nav-chevron,
        .sidebar-nav-item--active .sidebar-nav-chevron {
          opacity: 0.5;
        }

        .sidebar-footer {
          padding: 16px 16px 20px;
          border-top: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .sidebar-status {
          display: flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-family: var(--font-mono);
        }
        .sidebar-status--online  { color: var(--emerald); }
        .sidebar-status--offline { color: var(--rose); }
        .sidebar-tagline {
          font-size: 10px; color: var(--text-muted);
          letter-spacing: 0.08em; font-style: italic;
        }

        /* Mobile */
        .mobile-menu-btn {
          display: none;
          position: fixed; top: 16px; left: 16px; z-index: 200;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          padding: 8px; cursor: pointer;
        }
        .sidebar-close-btn {
          display: none;
          position: absolute; top: 14px; right: 14px;
          background: transparent; border: none;
          color: var(--text-muted); cursor: pointer;
          padding: 4px;
        }
        .sidebar-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 99;
          background: rgba(0,0,0,.6);
          backdrop-filter: blur(4px);
        }

        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex; align-items: center; justify-content: center; }
          .sidebar-close-btn { display: block; }
          .sidebar-overlay { display: block; }
          .sidebar {
            position: fixed; left: 0; top: 0; z-index: 100;
            transform: translateX(-100%);
            transition: transform var(--transition-slow);
          }
          .sidebar--open { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
