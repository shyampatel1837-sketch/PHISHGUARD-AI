import React from 'react'
import { motion } from 'framer-motion'
import { BarChart3, PieChart, TrendingUp, Activity } from 'lucide-react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart as RechartsPie, Pie, Cell, LineChart, Line, Legend,
} from 'recharts'

/**
 * Analytics page — prepared with Recharts-based chart components.
 * All charts display empty states until real scan data is available from the backend.
 *
 * When a database is connected and the /api/statistics endpoint returns data,
 * replace the `EMPTY_DATA` constants with API responses.
 */

const CHART_COLORS = ['#38bdf8', '#34d399', '#fb7185', '#fbbf24', '#a78bfa']

const EMPTY_BAR_DATA = [
  { name: 'Mon', scans: 0 },
  { name: 'Tue', scans: 0 },
  { name: 'Wed', scans: 0 },
  { name: 'Thu', scans: 0 },
  { name: 'Fri', scans: 0 },
  { name: 'Sat', scans: 0 },
  { name: 'Sun', scans: 0 },
]

const EMPTY_PIE_DATA = [
  { name: 'No Data', value: 1 },
]

function ChartCard({ icon: Icon, title, children, height = 220 }) {
  return (
    <motion.div
      className="glass analytics-chart-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="analytics-card-header">
        <Icon size={15} color="var(--accent)" />
        <span>{title}</span>
      </div>
      <div style={{ height }}>
        {children}
      </div>
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
  const hasData = false // Set to true when API returns real statistics

  return (
    <div className="analytics-page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">
          Detection trends, risk distribution, and scan activity
        </p>
      </motion.div>

      {/* Notice */}
      {!hasData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="analytics-notice"
        >
          <Activity size={14} />
          <span>
            Charts will populate with real data once the database is connected and
            scan history is available. The chart layouts are ready — no changes needed.
          </span>
        </motion.div>
      )}

      {/* Scan Activity — bar chart */}
      <ChartCard icon={BarChart3} title="Scan Activity (last 7 days)" height={200}>
        <div style={{ position: 'relative', height: '100%' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={EMPTY_BAR_DATA} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }}
                labelStyle={{ color: 'var(--text-secondary)' }}
              />
              <Bar dataKey="scans" fill="var(--accent)" radius={[4, 4, 0, 0]} opacity={0.6} />
            </BarChart>
          </ResponsiveContainer>
          {!hasData && <EmptyChartOverlay message="No scan data available yet" />}
        </div>
      </ChartCard>

      {/* Two-column charts */}
      <div className="analytics-two-col">
        {/* Risk distribution — pie */}
        <ChartCard icon={PieChart} title="Risk Distribution" height={200}>
          <div style={{ position: 'relative', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={EMPTY_PIE_DATA}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill="var(--border)" />
                </Pie>
              </RechartsPie>
            </ResponsiveContainer>
            {!hasData && <EmptyChartOverlay message="Awaiting scan data" />}
          </div>
        </ChartCard>

        {/* Legitimate vs phishing trend — line */}
        <ChartCard icon={TrendingUp} title="Legitimate vs Phishing Trend" height={200}>
          <div style={{ position: 'relative', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={EMPTY_BAR_DATA} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="legitimate" stroke="var(--emerald)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="phishing"   stroke="var(--rose)"    strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            {!hasData && <EmptyChartOverlay message="Awaiting scan data" />}
          </div>
        </ChartCard>
      </div>

      <style>{`
        .analytics-page { display: flex; flex-direction: column; gap: 20px; max-width: 1200px; }

        .analytics-notice {
          display: flex; align-items: flex-start; gap: 8px;
          background: var(--accent-dim);
          border: 1px solid var(--border-accent);
          border-radius: var(--radius-md);
          padding: 12px 16px;
          font-size: 12.5px; color: var(--text-secondary);
        }
        .analytics-notice svg { flex-shrink: 0; margin-top: 1px; color: var(--accent); }

        .analytics-chart-card { padding: 20px; }
        .analytics-card-header {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 14px;
        }

        .analytics-two-col {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        @media (max-width: 768px) { .analytics-two-col { grid-template-columns: 1fr; } }

        .analytics-empty-overlay {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 8px;
          background: rgba(8,12,20,.65);
          backdrop-filter: blur(2px);
          border-radius: var(--radius-md);
        }
        .analytics-empty-text { font-size: 12px; color: var(--text-muted); }
      `}</style>
    </div>
  )
}
