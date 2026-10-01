import React from 'react'
import { motion } from 'framer-motion'

/**
 * StatCard — reusable metric card for the dashboard.
 *
 * Props:
 *   icon      — Lucide icon component
 *   label     — card title
 *   value     — display value (string | number | null)
 *   color     — CSS colour token e.g. "var(--accent)"
 *   trend     — optional { direction: 'up'|'down', label: string }
 *   pending   — if true, shows a "--" placeholder
 */
export default function StatCard({ icon: Icon, label, value, color = 'var(--accent)', trend, pending = false }) {
  return (
    <motion.div
      className="stat-card glass glass-hover"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon" style={{ background: `${color}18`, color }}>
          <Icon size={16} />
        </div>
      </div>

      <div className="stat-card-value" style={{ color: pending ? 'var(--text-muted)' : color }}>
        {pending || value === null || value === undefined ? '—' : value}
      </div>

      {pending ? (
        <div className="stat-card-sub">Not available yet</div>
      ) : trend ? (
        <div className={`stat-card-trend stat-card-trend--${trend.direction}`}>
          {trend.direction === 'up' ? '↑' : '↓'} {trend.label}
        </div>
      ) : null}

      <style>{`
        .stat-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-height: 120px;
        }
        .stat-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .stat-card-label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .stat-card-icon {
          width: 32px; height: 32px;
          border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .stat-card-value {
          font-size: 30px;
          font-weight: 700;
          letter-spacing: -0.03em;
          line-height: 1;
          font-family: var(--font-mono);
        }
        .stat-card-sub {
          font-size: 11px;
          color: var(--text-muted);
          font-style: italic;
        }
        .stat-card-trend {
          font-size: 12px;
          font-weight: 500;
        }
        .stat-card-trend--up   { color: var(--emerald); }
        .stat-card-trend--down { color: var(--rose); }
      `}</style>
    </motion.div>
  )
}
