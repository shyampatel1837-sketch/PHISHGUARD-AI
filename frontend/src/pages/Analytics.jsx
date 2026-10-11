import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, PieChart, TrendingUp, Activity, DatabaseZap } from 'lucide-react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { getStatistics } from '../services/api'

const EMPTY_BAR_DATA = [
  { name: 'Mon', scans: 0 },
  { name: 'Tue', scans: 0 },
  { name: 'Wed', scans: 0 },
  { name: 'Thu', scans: 0 },
  { name: 'Fri', scans: 0 },
  { name: 'Sat', scans: 0 },
  { name: 'Sun', scans: 0 },
]

const EMPTY_PIE_DATA = [{ name: 'No Data', value: 1 }]

function ChartCard({ icon: Icon, title, children, height = 220 }) {
  return (
    <motion.div className="glass analytics-chart-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="analytics-card-header">
        <Icon size={15} color="var(--accent)" />
        <span>{title}</span>
      </div>
      <div style={{ height }}>{children}</div>
    </motion.div>
  )
}

function EmptyChartOverlay({ message }) {
  return (
    <div className="analytics-empty-overlay">
      <BarChart3 size={28} color="var(--text-muted)" />
      <div className="analytics-empty-text">{message}</div>
    </div>
  )
}

export default function Analytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadStats() {
      try {
        const data = await getStatistics()
        if (active) setStats(data)
      } catch {
        if (active) setStats(null)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadStats()
    return () => { active = false }
  }, [])

  const hasData = stats && (stats.total_scans != null || stats.phishing_detected != null || stats.legitimate_urls != null || stats.detection_accuracy != null)

  return (
    <div className="analytics-page">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Detection trends, risk distribution, and scan activity</p>
      </motion.div>

      {!hasData && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="analytics-notice">
          <Activity size={14} />
          <span>
            {loading ? 'Loading latest analytics…' : 'No live database statistics are available yet. Charts are ready to display real data once scan records are connected.'}
          </span>
        </motion.div>
      )}

      <div className="mini-stat-strip">
        <div className="mini-stat glass">
          <label>Total Scans</label>
          <strong>{stats?.total_scans ?? 'N/A'}</strong>
        </div>
        <div className="mini-stat glass">
          <label>Phishing</label>
          <strong>{stats?.phishing_detected ?? 'N/A'}</strong>
        </div>
        <div className="mini-stat glass">
          <label>Legitimate</label>
          <strong>{stats?.legitimate_urls ?? 'N/A'}</strong>
        </div>
        <div className="mini-stat glass">
          <label>Accuracy</label>
          <strong>{stats?.detection_accuracy != null ? `${Number(stats.detection_accuracy).toFixed(1)}%` : 'N/A'}</strong>
        </div>
      </div>

      <ChartCard icon={BarChart3} title="Scan Activity (last 7 days)" height={220}>
        <div style={{ position: 'relative', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={EMPTY_BAR_DATA} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} labelStyle={{ color: 'var(--text-secondary)' }} />
              <Bar dataKey="scans" fill="var(--accent)" radius={[4, 4, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
          {!hasData && <EmptyChartOverlay message="No scan data available yet" />}
        </div>
      </ChartCard>

      <div className="analytics-two-col">
        <ChartCard icon={PieChart} title="Risk Distribution" height={220}>
          <div style={{ position: 'relative', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={EMPTY_PIE_DATA} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" stroke="none">
                  <Cell fill="var(--border)" />
                </Pie>
              </RechartsPie>
            </ResponsiveContainer>
            {!hasData && <EmptyChartOverlay message="Awaiting scan data" />}
          </div>
        </ChartCard>

        <ChartCard icon={TrendingUp} title="Legitimate vs Phishing Trend" height={220}>
          <div style={{ position: 'relative', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EMPTY_BAR_DATA} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="legitimate" stroke="var(--emerald)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="phishing" stroke="var(--rose)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            {!hasData && <EmptyChartOverlay message="Awaiting scan data" />}
          </div>
        </ChartCard>
      </div>
    </div>
  )
}

