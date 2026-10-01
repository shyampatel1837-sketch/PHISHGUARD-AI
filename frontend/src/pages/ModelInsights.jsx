import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Cpu, Database, BarChart2, CheckCircle2, XCircle,
  Layers, GitBranch, BookOpen, AlertCircle,
} from 'lucide-react'
import { getModelStatus } from '../services/api'
import ModelStatusBadge from '../components/ModelStatusBadge'

/**
 * Model Insights page.
 *
 * Displays the ML model connection status and leaves well-labelled
 * placeholders for metrics, confusion matrix, and feature importance
 * that will be populated once the Random Forest is trained and connected.
 */

function MetricCard({ label, value, note, color = 'var(--accent)' }) {
  const hasValue = value !== null && value !== undefined
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
  const [model, setModel]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getModelStatus()
      .then(setModel)
      .catch(() => setModel(null))
      .finally(() => setLoading(false))
  }, [])

  const connected = model?.connected || false
  const status    = model?.model?.status || 'not_connected'

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay },
  })

  return (
    <div className="mi-page">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <h1 className="page-title">Model Insights</h1>
        <p className="page-subtitle">
          Random Forest classifier performance, features, and explainability
        </p>
      </motion.div>

      {/* Model status banner */}
      <motion.div {...fadeUp(0.05)} className={`glass mi-status-banner mi-status-banner--${connected ? 'connected' : 'disconnected'}`}>
        <div className="mi-status-icon">
          <Cpu size={26} />
        </div>
        <div className="mi-status-body">
          <div className="mi-status-title">
            {connected ? 'Random Forest Model — Connected' : 'Random Forest Model — Not Connected'}
          </div>
          <div className="mi-status-desc">
            {connected
              ? 'The model is loaded and ready for inference.'
              : (model?.message || 'Train the model, serialise it with joblib, and place the .pkl file at MODEL_PATH to enable predictions.')
            }
          </div>
        </div>
        <ModelStatusBadge status={status} />
      </motion.div>

      {/* Model info cards */}
      <motion.div {...fadeUp(0.08)} className="grid-4">
        <MetricCard label="Algorithm"    value={connected ? 'Random Forest' : null} note="sklearn" />
        <MetricCard label="Training Set" value={null} note="Not trained yet" />
        <MetricCard label="Features"     value={null} note="Pending pipeline" />
        <MetricCard label="Model File"   value={null} note=".pkl — not found" />
      </motion.div>

      {/* Performance metrics */}
      <motion.div {...fadeUp(0.1)} className="glass mi-section">
        <div className="mi-section-header">
          <BarChart2 size={15} />
          <span>Performance Metrics</span>
          {!connected && <span className="mi-section-pending">(Pending model connection)</span>}
        </div>
        <div className="grid-4">
          <MetricCard label="Accuracy"  value={model?.metrics?.accuracy  ? `${(model.metrics.accuracy  * 100).toFixed(1)}%` : null} color="var(--emerald)" note="Overall correctness" />
          <MetricCard label="Precision" value={model?.metrics?.precision ? `${(model.metrics.precision * 100).toFixed(1)}%` : null} color="var(--accent)"  note="True positive rate" />
          <MetricCard label="Recall"    value={model?.metrics?.recall    ? `${(model.metrics.recall    * 100).toFixed(1)}%` : null} color="var(--violet)" note="Sensitivity" />
          <MetricCard label="F1 Score"  value={model?.metrics?.f1_score  ? `${(model.metrics.f1_score  * 100).toFixed(1)}%` : null} color="var(--amber)"  note="Harmonic mean" />
        </div>
      </motion.div>

      {/* Confusion matrix */}
      <motion.div {...fadeUp(0.12)} className="glass mi-section">
        <div className="mi-section-header">
          <Layers size={15} />
          <span>Confusion Matrix</span>
        </div>
        {connected && model?.metrics?.confusion_matrix ? (
          <div>{/* Render confusion matrix grid here */}</div>
        ) : (
          <div className="empty-state">
            <Layers size={36} className="empty-state-icon" />
            <div className="empty-state-title">Confusion matrix not available</div>
            <div className="empty-state-desc">
              Will be populated from model evaluation results once the Random Forest
              is trained and evaluation metrics are saved.
            </div>
          </div>
        )}
      </motion.div>

      {/* Feature importance */}
      <motion.div {...fadeUp(0.14)} className="glass mi-section">
        <div className="mi-section-header">
          <GitBranch size={15} />
          <span>Feature Importance</span>
        </div>
        {connected && model?.metrics?.feature_importance ? (
          <div>{/* Render feature importance bar chart here */}</div>
        ) : (
          <div className="empty-state">
            <GitBranch size={36} className="empty-state-icon" />
            <div className="empty-state-title">Feature importance not available</div>
            <div className="empty-state-desc">
              Random Forest feature importances will appear here once the model is
              trained. The feature importances will show which URL characteristics
              contribute most to phishing classification.
            </div>
          </div>
        )}
      </motion.div>

      {/* XAI / SHAP */}
      <motion.div {...fadeUp(0.16)} className="glass mi-section">
        <div className="mi-section-header">
          <BookOpen size={15} />
          <span>Explainable AI — SHAP Values</span>
        </div>
        <div className="empty-state">
          <AlertCircle size={36} className="empty-state-icon" />
          <div className="empty-state-title">XAI not available yet</div>
          <div className="empty-state-desc">
            SHAP explanations, force plots, and summary plots will appear here
            once the model is trained and SHAP integration is added. This section
            will explain why the model classified each URL as phishing or legitimate.
          </div>
        </div>
      </motion.div>

      {/* Integration guide */}
      <motion.div {...fadeUp(0.18)} className="glass mi-integration-guide">
        <div className="mi-section-header">
          <Cpu size={15} />
          <span>How to Connect Your Random Forest</span>
        </div>
        <ol className="mi-guide-steps">
          <li>Train your Random Forest model on the phishing dataset.</li>
          <li>Serialise it: <code>joblib.dump(model, "model/phishing_model.pkl")</code></li>
          <li>Set <code>MODEL_PATH=model/phishing_model.pkl</code> in <code>backend/.env</code></li>
          <li>Uncomment the <code>joblib.load()</code> call in <code>app/services/ml_service.py</code></li>
          <li>Implement the <code>_build_feature_vector()</code> helper to match training features.</li>
          <li>Restart the FastAPI server — the model loads automatically.</li>
        </ol>
      </motion.div>

      <style>{`
        .mi-page { display: flex; flex-direction: column; gap: 20px; max-width: 1200px; }

        .mi-status-banner {
          display: flex; align-items: flex-start; gap: 16px;
          padding: 20px; flex-wrap: wrap;
        }
        .mi-status-banner--connected   { border-color: rgba(52,211,153,.25); }
        .mi-status-banner--disconnected { border-color: rgba(251,191,36,.2); }

        .mi-status-icon {
          width: 52px; height: 52px;
          border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .mi-status-banner--connected   .mi-status-icon { background: var(--emerald-dim); color: var(--emerald); }
        .mi-status-banner--disconnected .mi-status-icon { background: var(--amber-dim); color: var(--amber); }

        .mi-status-body   { flex: 1; }
        .mi-status-title  { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
        .mi-status-desc   { font-size: 13px; color: var(--text-secondary); line-height: 1.6; }

        .mi-section { padding: 20px; display: flex; flex-direction: column; gap: 16px; }

        .mi-section-header {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600;
          color: var(--text-secondary);
        }
        .mi-section-pending { font-size: 11px; color: var(--text-muted); margin-left: 4px; font-style: italic; }

        .mi-metric-card {
          padding: 16px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .mi-metric-label { font-size: 11px; font-weight: 600; color: var(--text-muted); letter-spacing: 0.07em; text-transform: uppercase; }
        .mi-metric-value { font-size: 24px; font-weight: 700; font-family: var(--font-mono); }
        .mi-metric-note  { font-size: 11px; color: var(--text-muted); }

        .mi-integration-guide { padding: 20px; }
        .mi-guide-steps {
          list-style: decimal;
          padding-left: 20px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .mi-guide-steps li { font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; }
        .mi-guide-steps code {
          font-family: var(--font-mono);
          font-size: 12.5px;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 1px 6px;
          color: var(--accent);
        }
      `}</style>
    </div>
  )
}
