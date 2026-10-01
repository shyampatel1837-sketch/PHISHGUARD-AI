import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe, ShieldAlert, ShieldCheck, Target,
  Cpu, ArrowRight, History, Activity, Server,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import URLInput from '../components/URLInput'
import ModelStatusBadge from '../components/ModelStatusBadge'
import { useHealthCheck } from '../hooks/useHealthCheck'
import { getStatistics, getModelStatus } from '../services/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const { online, health } = useHealthCheck()
  const [modelInfo, setModelInfo] = useState(null)

  useEffect(() => {
    getModelStatus().then(setModelInfo).catch(() => {})
  }, [])

  function handleQuickScan(url) {
    // Pass the URL through router state so Scanner can pre-fill and run it
    navigate('/scanner', { state: { url } })
  }

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  })

  return (
    <div className="dashboard-page">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0)} className="dash-header">
        <div>
          <h1 className="page-title">Security Dashboard</h1>
          <p className="page-subtitle">Real-time overview of phishing detection activity</p>
        </div>
        <div className="dash-header-actions">
          <ModelStatusBadge status={modelInfo?.model?.status || 'not_connected'} />
        </div>
      </motion.div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <motion.div {...fadeUp(0.05)} className="grid-4">
        <StatCard
          icon={Globe}
          label="URLs Analyzed"
          value={null}
          color="var(--accent)"
          pending
        />
        <StatCard
          icon={ShieldAlert}
          label="Threats Detected"
          value={null}
          color="var(--rose)"
          pending
        />
        <StatCard
          icon={ShieldCheck}
          label="Safe URLs"
          value={null}
          color="var(--emerald)"
          pending
        />
        <StatCard
          icon={Target}
          label="Detection Accuracy"
          value={null}
          color="var(--violet)"
          pending
        />
      </motion.div>

      {/* ── Main content grid ───────────────────────────────────────────────── */}
      <div className="dash-main-grid">
        {/* Quick scanner */}
        <motion.div {...fadeUp(0.1)} className="glass dash-scanner-card">
          <div className="dash-card-header">
            <Globe size={16} color="var(--accent)" />
            <span>Quick URL Scanner</span>
          </div>
          <p className="dash-card-desc">
            Paste any URL below to run an instant security analysis.
          </p>
          <URLInput onSubmit={handleQuickScan} compact />
          <button
            className="dash-full-scanner-link"
            onClick={() => navigate('/scanner')}
          >
            Open full scanner <ArrowRight size={13} />
          </button>
        </motion.div>

        {/* System status */}
        <motion.div {...fadeUp(0.12)} className="glass dash-system-card">
          <div className="dash-card-header">
            <Activity size={16} color="var(--emerald)" />
            <span>System Status</span>
          </div>

          <div className="dash-status-list">
            <StatusRow
              label="API Server"
              status={online ? 'online' : 'offline'}
              detail={online ? `v${health?.version}` : 'Not reachable'}
            />
            <StatusRow
              label="ML Model"
              status={modelInfo?.connected ? 'online' : 'pending'}
              detail={modelInfo?.model?.status || 'not_connected'}
            />
            <StatusRow
              label="Feature Engine"
              status={online ? 'online' : 'offline'}
              detail="URL parsing active"
            />
            <StatusRow
              label="Database"
              status="pending"
              detail="Not connected"
            />
          </div>
        </motion.div>
      </div>

      {/* ── Recent scans + Risk distribution ────────────────────────────────── */}
      <div className="dash-lower-grid">
        {/* Recent scans */}
        <motion.div {...fadeUp(0.15)} className="glass dash-recent-card">
          <div className="dash-card-header">
            <History size={16} color="var(--text-secondary)" />
            <span>Recent Scans</span>
            <button
              className="dash-view-all"
              onClick={() => navigate('/history')}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="empty-state">
            <History size={36} className="empty-state-icon" />
            <div className="empty-state-title">No scans yet</div>
            <div className="empty-state-desc">
              Recent scan results will appear here once you start analysing URLs.
            </div>
          </div>
        </motion.div>

        {/* ML Model info */}
        <motion.div {...fadeUp(0.17)} className="glass dash-model-card">
          <div className="dash-card-header">
            <Cpu size={16} color="var(--violet)" />
            <span>ML Model Status</span>
          </div>

          <div className="dash-model-body">
            <div className="dash-model-icon">
              <Cpu size={32} />
            </div>
            <div className="dash-model-name">Random Forest Classifier</div>
            <ModelStatusBadge status={modelInfo?.model?.status || 'not_connected'} />
            <p className="dash-model-desc">
              The machine learning model has not been connected yet. Once trained and
              serialised, it will be loaded automatically at server startup.
            </p>
            <button
              className="btn btn-ghost dash-model-btn"
              onClick={() => navigate('/model')}
            >
              View Model Insights <ArrowRight size={13} />
            </button>
          </div>
        </motion.div>
      </div>

      <style>{`
        .dashboard-page { display: flex; flex-direction: column; gap: 24px; max-width: 1400px; }

        .dash-header {
          display: flex; align-items: flex-start;
          justify-content: space-between; flex-wrap: wrap; gap: 12px;
        }
        .dash-header-actions { display: flex; align-items: center; gap: 10px; }

        .dash-main-grid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) { .dash-main-grid { grid-template-columns: 1fr; } }

        .dash-lower-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 16px;
        }
        @media (max-width: 900px) { .dash-lower-grid { grid-template-columns: 1fr; } }

        .dash-card-header {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 14px;
        }
        .dash-card-header span { flex: 1; }
        .dash-card-desc { font-size: 13px; color: var(--text-muted); margin-bottom: 14px; }

        .dash-full-scanner-link {
          background: transparent; border: none; cursor: pointer;
          color: var(--accent); font-size: 12px; font-weight: 600;
          display: flex; align-items: center; gap: 4px;
          margin-top: 12px; padding: 0;
          transition: opacity var(--transition);
        }
        .dash-full-scanner-link:hover { opacity: 0.7; }

        .dash-scanner-card,
        .dash-system-card,
        .dash-recent-card,
        .dash-model-card { padding: 20px; }

        .dash-status-list { display: flex; flex-direction: column; gap: 10px; }

        .dash-model-body {
          display: flex; flex-direction: column; align-items: center;
          gap: 10px; text-align: center; padding: 8px 0;
        }
        .dash-model-icon { color: var(--text-muted); opacity: 0.4; }
        .dash-model-name { font-size: 14px; font-weight: 700; color: var(--text-secondary); }
        .dash-model-desc {
          font-size: 12px; color: var(--text-muted);
          max-width: 260px; line-height: 1.6;
        }
        .dash-model-btn { font-size: 12px; }

        .dash-view-all {
          background: transparent; border: none; cursor: pointer;
          color: var(--accent); font-size: 11px;
          display: flex; align-items: center; gap: 4px;
          font-weight: 600; padding: 0;
        }
      `}</style>
    </div>
  )
}

function StatusRow({ label, status, detail }) {
  const dot = {
    online:  'var(--emerald)',
    offline: 'var(--rose)',
    pending: 'var(--amber)',
  }[status] || 'var(--text-muted)'

  return (
    <div className="sr-row">
      <div className="sr-dot" style={{ background: dot, boxShadow: `0 0 6px ${dot}` }} />
      <div className="sr-label">{label}</div>
      <div className="sr-detail">{detail}</div>

      <style>{`
        .sr-row { display: flex; align-items: center; gap: 10px; }
        .sr-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .sr-label { flex: 1; font-size: 13px; color: var(--text-secondary); }
        .sr-detail { font-size: 11.5px; color: var(--text-muted); font-family: var(--font-mono); }
      `}</style>
    </div>
  )
}
