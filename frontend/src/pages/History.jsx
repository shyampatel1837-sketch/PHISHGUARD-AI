import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { History, Search, ArrowRight, ShieldCheck, ShieldAlert } from 'lucide-react'
import { getScans } from '../services/api'

export default function HistoryPage() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    getScans()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const scans = data?.scans || []

  const filteredScans = useMemo(() => {
    if (!query.trim()) return scans

    const filterValue = query.toLowerCase()
    return scans.filter((scan) => {
      const url = (scan.url || '').toLowerCase()
      const classification = (scan.classification || '').toLowerCase()
      return url.includes(filterValue) || classification.includes(filterValue)
    })
  }, [query, scans])

  return (
    <div className="history-page">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="history-header"
      >
        <div>
          <h1 className="page-title">Scan History</h1>
          <p className="page-subtitle">All previously analysed URLs and their outcomes</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/scanner')}>
          <Search size={15} />
          New Scan
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="glass history-table-card"
      >
        <div className="history-toolbar">
          <div className="history-count">{loading ? 'Loading…' : `${filteredScans.length} results`}</div>
          <label className="history-search" aria-label="Search scans">
            <Search size={14} />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search URLs or status"
            />
          </label>
        </div>

        {loading ? (
          <div className="empty-state compact">
            <div className="empty-state-title">Loading scan history…</div>
          </div>
        ) : filteredScans.length === 0 ? (
          <div className="empty-state compact">
            <History size={40} className="empty-state-icon" />
            <div className="empty-state-title">No scan history available</div>
            <div className="empty-state-desc">
              {data?.message || 'Scan records will appear here once a backend database is connected and URLs are analysed.'}
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/scanner')}>
              <ArrowRight size={14} />
              Start Scanning
            </button>
          </div>
        ) : (
          <div className="table-shell">
            <table className="history-table">
              <thead>
                <tr>
                  <th>URL</th>
                  <th>Classification</th>
                  <th>Risk</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredScans.map((scan) => (
                  <tr key={scan.id || scan.url || scan.scanned_at}>
                    <td className="mono">{scan.url}</td>
                    <td>
                      {scan.classification === 'phishing' ? (
                        <span className="cell-pill cell-pill--rose"><ShieldAlert size={12} /> Phishing</span>
                      ) : scan.classification === 'legitimate' ? (
                        <span className="cell-pill cell-pill--emerald"><ShieldCheck size={12} /> Legitimate</span>
                      ) : (
                        <span className="cell-pill cell-pill--muted">Unknown</span>
                      )}
                    </td>
                    <td>{scan.risk_score != null ? `${Math.round(scan.risk_score * 100)}%` : '—'}</td>
                    <td>{scan.scanned_at ? new Date(scan.scanned_at).toLocaleString() : '—'}</td>
                    <td>
                      <span className={`badge ${scan.status === 'completed' ? 'badge-emerald' : 'badge-muted'}`}>
                        {scan.status || 'completed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}

