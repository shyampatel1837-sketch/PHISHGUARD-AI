import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Globe,
  ShieldAlert,
  ShieldCheck,
  Target,
  Cpu,
  ArrowRight,
  History,
  Activity,
  ScanLine,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import URLInput from '../components/URLInput'
import ModelStatusBadge from '../components/ModelStatusBadge'
import { useHealthCheck } from '../hooks/useHealthCheck'
import { getStatistics, getModelStatus, getScans } from '../services/api'

const formatMetric = (value) => {
  if (value === null || value === undefined) return 'N/A'
  if (typeof value === 'number') return value.toLocaleString()
  return value
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { online, health } = useHealthCheck()
  const [modelInfo, setModelInfo] = useState(null)
  const [stats, setStats] = useState(null)
  const [recentScans, setRecentScans] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadDashboardData() {
      try {
        const [statsData, scansData, modelData] = await Promise.all([
          getStatistics(),
          getScans(),
          getModelStatus(),
        ])

        if (!active) return

        setStats(statsData)
        setRecentScans((scansData?.scans || []).slice(0, 5))
        setModelInfo(modelData)
      } catch {
        if (!active) return
        setStats(null)
        setRecentScans([])
        setModelInfo(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboardData()
    return () => {
      active = false
    }
  }, [])

  function handleQuickScan(url) {
    navigate('/scanner', { state: { url } })
  }

  const statCards = useMemo(
    () => [
      {
        icon: Globe,
        label: 'Total Scans',
        value: formatMetric(stats?.total_scans),
        color: 'var(--accent)',
        pending: stats?.total_scans === null || stats?.total_scans === undefined,
      },
      {
        icon: ShieldAlert,
        label: 'Threats Detected',
        value: formatMetric(stats?.phishing_detected),
        color: 'var(--rose)',
        pending: stats?.phishing_detected === null || stats?.phishing_detected === undefined,
      },
      {
        icon: ShieldCheck,
        label: 'Legitimate URLs',
        value: formatMetric(stats?.legitimate_urls),
        color: 'var(--emerald)',
        pending: stats?.legitimate_urls === null || stats?.legitimate_urls === undefined,
      },
      {
        icon: Target,
        label: 'Detection Rate',
        value:
          stats?.detection_accuracy === null || stats?.detection_accuracy === undefined
            ? 'N/A'
            : `${Number(stats.detection_accuracy).toFixed(1)}%`,
        color: 'var(--violet)',
        pending: stats?.detection_accuracy === null || stats?.detection_accuracy === undefined,
      },
    ],
    [stats]
  )

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  })

  return (
    <div className="dashboard-page">
      <motion.section {...fadeUp(0)} className="hero-panel glass">
        <div className="hero-copy">
          <div className="eyebrow-row">
            <Sparkles size={12} />
            <span>Phishing Defense Platform</span>
          </div>
          <h1 className="hero-title">Your First Line of Defense Against Phishing.</h1>
          <p className="hero-description">
            Analyze suspicious URLs with real structural threat intelligence and AI-assisted risk scoring.
          </p>

          <div className="hero-actions">
            <button className="btn btn-primary" onClick={() => navigate('/scanner')}>
              <ScanLine size={16} />
              Analyze URL
            </button>
            <button className="btn btn-ghost" onClick={() => navigate('/model')}>
              <Cpu size={16} />
              Model Status
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="pulse-orb orb-one" />
          <div className="pulse-orb orb-two" />
          <div className="hero-panel-card">
            <div className="hero-panel-header">
              <span>Threat Pulse</span>
              <span className="status-dot online" />
            </div>

            <div className="hero-panel-metric">
              <strong>{online ? 'Live' : 'Offline'}</strong>
              <small>{online ? 'Backend connected' : 'Backend unavailable'}</small>
            </div>

            <div className="mini-metrics">
              <div>
                <label>Model</label>
                <span>{modelInfo?.connected ? 'Connected' : 'Pending'}</span>
              </div>
              <div>
                <label>Risk</label>
                <span>{stats?.detection_accuracy !== null && stats?.detection_accuracy !== undefined ? `${Number(stats.detection_accuracy).toFixed(1)}%` : 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.div {...fadeUp(0.05)} className="grid-4">
        {statCards.map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            color={card.color}
            pending={card.pending}
          />
        ))}
      </motion.div>

      <div className="dash-main-grid">
        <motion.section {...fadeUp(0.08)} className="glass dash-scanner-card">
          <div className="dash-card-header">
            <Globe size={16} color="var(--accent)" />
            <span>Quick URL Scanner</span>
          </div>
          <p className="dash-card-desc">Paste any URL below to run an instant phishing risk analysis.</p>
          <URLInput onSubmit={handleQuickScan} compact />
          <button className="dash-full-scanner-link" onClick={() => navigate('/scanner')}>
            Open full scanner <ArrowRight size={13} />
          </button>
        </motion.section>

        <motion.section {...fadeUp(0.1)} className="glass dash-system-card">
          <div className="dash-card-header">
            <Activity size={16} color="var(--emerald)" />
            <span>System Status</span>
          </div>

          <div className="dash-status-list">
            <StatusRow
              label="API Server"
              status={online ? 'online' : 'offline'}
              detail={online ? `v${health?.version || '1.0.0'}` : 'Not reachable'}
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
              label="Scan History"
              status={recentScans.length ? 'online' : 'pending'}
              detail={recentScans.length ? `${recentScans.length} recent entries` : 'No data yet'}
            />
          </div>
        </motion.section>
      </div>

      <div className="dash-lower-grid">
        <motion.section {...fadeUp(0.12)} className="glass dash-recent-card">
          <div className="dash-card-header">
            <History size={16} color="var(--text-secondary)" />
            <span>Recent Scans</span>
            <button className="dash-view-all" onClick={() => navigate('/history')}>
              View all <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="mini-empty-state">Loading recent activity…</div>
          ) : recentScans.length === 0 ? (
            <div className="empty-state compact">
              <History size={34} className="empty-state-icon" />
              <div className="empty-state-title">No scans recorded yet</div>
              <div className="empty-state-desc">Use the scanner to generate your first real URL analysis.</div>
            </div>
          ) : (
            <div className="recent-scan-list">
              {recentScans.map((scan) => (
                <div className="scan-row" key={scan.id || scan.url || scan.scanned_at}>
                  <div className="scan-meta">
                    <span className="scan-url">{scan.url}</span>
                    <small>{scan.scanned_at ? new Date(scan.scanned_at).toLocaleString() : 'Recent'}</small>
                  </div>
                  <div className="scan-status-group">
                    <span className={`badge ${scan.classification === 'phishing' ? 'badge-rose' : scan.classification === 'legitimate' ? 'badge-emerald' : 'badge-muted'}`}>
                      {scan.classification || 'Unknown'}
                    </span>
                    <span className="scan-risk">{scan.risk_score != null ? `${(scan.risk_score * 100).toFixed(0)}%` : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        <motion.section {...fadeUp(0.14)} className="glass dash-model-card">
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
              {modelInfo?.connected
                ? 'The current model is loaded and ready for inference.'
                : 'The model will be loaded automatically once the trained artifact is present and connected.'}
            </p>
            <button className="btn btn-ghost dash-model-btn" onClick={() => navigate('/model')}>
              View Model Insights <ArrowRight size={13} />
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  )
}

function StatusRow({ label, status, detail }) {
  const dot = {
    online: 'var(--emerald)',
    offline: 'var(--rose)',
    pending: 'var(--amber)',
  }[status] || 'var(--text-muted)'

  return (
    <div className="sr-row">
      <div className="sr-label">{label}</div>
      <div className="sr-meta">
        <span className="sr-dot" style={{ background: dot }} />
        <span>{detail}</span>
      </div>
    </div>
  )
}
