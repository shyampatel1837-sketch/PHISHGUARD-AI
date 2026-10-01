import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { History, Search, Filter, ArrowRight } from 'lucide-react'
import { getScans } from '../services/api'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getScans()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const scans = data?.scans || []

  return (
    <div className="history-page">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="history-header"
      >
        <div>
          <h1 className="page-title">Scan History</h1>
          <p className="page-subtitle">
            All previously analysed URLs and their results
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/scanner')}>
          <Search size={15} />
          New Scan
        </button>
      </motion.div>

      {/* Table card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="glass history-table-card"
      >
        {/* Toolbar */}
        <div className="history-toolbar">
          <div className="history-count">
            {loading ? '…' : scans.length} results
          </div>
          <button className="btn btn-ghost history-filter-btn" disabled>
            <Filter size={14} />
            Filter
          </button>
        </div>

        {/* Table */}
        {loading ? (
          <div className="empty-state">
            <div className="empty-state-title">Loading…</div>
          </div>
        ) : scans.length === 0 ? (
          <div className="empty-state">
            <History size={40} className="empty-state-icon" />
            <div className="empty-state-title">No scan history available</div>
            <div className="empty-state-desc">
              {data?.message || 'Scan records will appear here once a database is connected and URLs have been analysed.'}
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/scanner')}>
              <ArrowRight size={14} />
              Start Scanning
            </button>
          </div>
        ) : (
          <table className="history-table">
            <thead>
              <tr>
                <th>URL</th>
                <th>Classification</th>
                <th>Risk Score</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scans.map(scan => (
                <tr key={scan.id}>
                  <td className="mono">{scan.url}</td>
                  <td>{scan.classification || '—'}</td>
                  <td>{scan.risk_score != null ? `${Math.round(scan.risk_score * 100)}%` : '—'}</td>
                  <td>{new Date(scan.scanned_at).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${scan.status === 'completed' ? 'emerald' : 'muted'}`}>{scan.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      <style>{`
        .history-page { display: flex; flex-direction: column; gap: 24px; max-width: 1200px; }
        .history-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .history-table-card { padding: 0; overflow: hidden; }

        .history-toolbar {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
        }
        .history-count { font-size: 13px; color: var(--text-muted); }
        .history-filter-btn { font-size: 12px; padding: 7px 14px; }

        .history-table { width: 100%; border-collapse: collapse; }
        .history-table th {
          text-align: left; padding: 12px 20px;
          font-size: 11px; font-weight: 600;
          color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border);
        }
        .history-table td {
          padding: 13px 20px;
          font-size: 13px; color: var(--text-secondary);
          border-bottom: 1px solid var(--border);
          max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .history-table tr:last-child td { border-bottom: none; }
        .history-table tr:hover td { background: var(--bg-elevated); }
      `}</style>
    </div>
  )
}
