import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Cpu, BarChart2, Layers, GitBranch, BookOpen, AlertCircle } from 'lucide-react'
import { getModelStatus } from '../services/api'
import ModelStatusBadge from '../components/ModelStatusBadge'

function MetricCard({ label, value, note, color = 'var(--accent)' }) {
  const hasValue = value !== null && value !== undefined && value !== 'N/A'
  return (
    <div className="mi-metric-card glass">
      <div className="mi-metric-label">{label}</div>
      <div className="mi-metric-value" style={{ color: hasValue ? color : 'var(--text-muted)' }}>
        {hasValue ? value : '—'}
      </div>
      {note && <div className="mi-metric-note">{note}</div>}
    </div>
  )
}

export default function ModelInsights() {
  const [model, setModel] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getModelStatus()
      .then(setModel)
      .catch(() => setModel(null))
      .finally(() => setLoading(false))
  }, [])

  const connected = Boolean(model?.connected)
  const status = model?.model?.status || 'not_connected'

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  })

  return (
    <div className="mi-page">
      <motion.div {...fadeUp(0)}>
        <h1 className="page-title">Model Insights</h1>
        <p className="page-subtitle">Random Forest classifier status, live metrics, and deployment readiness.</p>
      </motion.div>

      <motion.div {...fadeUp(0.05)} className={`glass mi-status-banner mi-status-banner--${connected ? 'connected' : 'disconnected'}`}>
        <div className="mi-status-icon">
          <Cpu size={26} />
        </div>
        <div className="mi-status-body">
          <div className="mi-status-title">
            {connected ? 'Random Forest Model — Connected' : 'Random Forest Model — Not Connected'}
          </div>
          <div className="mi-status-desc">
            {model?.message || (connected ? 'The current model is loaded and ready for URL inference.' : 'The model is not connected yet. Train and save the .pkl artifact to enable live predictions.')}
          </div>
        </div>
        <ModelStatusBadge status={status} />
      </motion.div>

      <motion.div {...fadeUp(0.08)} className="grid-4">
        <MetricCard label="Algorithm" value={connected ? model?.model?.algorithm || 'Random Forest' : '—'} note="Model family" />
        <MetricCard label="Threshold" value={model?.metrics?.threshold != null ? Number(model.metrics.threshold).toFixed(3) : '—'} note="Phishing cutoff" color="var(--violet)" />
        <MetricCard label="Feature Count" value={model?.metrics?.feature_count ?? '—'} note="URL feature vector" color="var(--emerald)" />
        <MetricCard label="Status" value={connected ? 'Ready' : 'Pending'} note="Inference state" color="var(--accent)" />
      </motion.div>

      <motion.div {...fadeUp(0.1)} className="glass mi-section">
        <div className="mi-section-header">
          <BarChart2 size={15} />
          <span>Performance Metrics</span>
        </div>
        <div className="grid-4">
          <MetricCard label="Accuracy" value={model?.metrics?.accuracy != null ? `${(Number(model.metrics.accuracy) * 100).toFixed(1)}%` : '—'} color="var(--emerald)" note="Overall correctness" />
          <MetricCard label="Precision" value={model?.metrics?.precision != null ? `${(Number(model.metrics.precision) * 100).toFixed(1)}%` : '—'} color="var(--accent)" note="Positive predictive value" />
          <MetricCard label="Recall" value={model?.metrics?.recall != null ? `${(Number(model.metrics.recall) * 100).toFixed(1)}%` : '—'} color="var(--violet)" note="Detection sensitivity" />
          <MetricCard label="F1 Score" value={model?.metrics?.f1_score != null ? `${(Number(model.metrics.f1_score) * 100).toFixed(1)}%` : '—'} color="var(--amber)" note="Balanced performance" />
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.12)} className="glass mi-section">
        <div className="mi-section-header">
          <Layers size={15} />
          <span>Confusion Matrix</span>
        </div>
        <div className="empty-state compact">
          <Layers size={36} className="empty-state-icon" />
          <div className="empty-state-title">Evaluation details are not available yet</div>
          <div className="empty-state-desc">The backend exposes accuracy and threshold metrics when the trained artifact is connected. A detailed confusion matrix will appear when that data is available.</div>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.14)} className="glass mi-section">
        <div className="mi-section-header">
          <GitBranch size={15} />
          <span>Feature Importance</span>
        </div>
        <div className="empty-state compact">
          <GitBranch size={36} className="empty-state-icon" />
          <div className="empty-state-title">Feature importance is not exposed</div>
          <div className="empty-state-desc">This solution currently exposes model readiness and evaluation metrics from the backend without additional XAI payloads.</div>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.16)} className="glass mi-section">
        <div className="mi-section-header">
          <BookOpen size={15} />
          <span>Explainable AI</span>
        </div>
        <div className="empty-state compact">
          <AlertCircle size={36} className="empty-state-icon" />
          <div className="empty-state-title">SHAP insights are not yet connected</div>
          <div className="empty-state-desc">Explanatory insights will appear here once the live model and explanation pipeline are integrated.</div>
        </div>
      </motion.div>

      <motion.div {...fadeUp(0.18)} className="glass mi-integration-guide">
        <div className="mi-section-header">
          <Cpu size={15} />
          <span>Deployment Notes</span>
        </div>
        <ol className="mi-guide-steps">
          <li>The model artifact is loaded directly from the backend when present.</li>
          <li>Risk classification uses the backend threshold and the current serialized model.</li>
          <li>Any additional feature/SHAP explanations require backend support and must be surfaced from the API.</li>
        </ol>
      </motion.div>
    </div>
  )
}

