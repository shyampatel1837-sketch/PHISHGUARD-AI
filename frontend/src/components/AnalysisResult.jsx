import React from 'react'
import { motion } from 'framer-motion'
import {
  Shield, AlertTriangle, CheckCircle, Globe, Lock, Unlock,
  Clock, RotateCcw, Info, Cpu,
} from 'lucide-react'
import { extractDomain, formatRelativeTime } from '../utils/urlUtils'
import FeatureAnalysis from './FeatureAnalysis'
import RiskScore from './RiskScore'

/**
 * AnalysisResult — the full result panel shown after a successful scan.
 *
 * Displays:
 *  - Classification banner (null when ML not connected)
 *  - Risk score gauge
 *  - URL feature breakdown
 *  - XAI placeholder
 *
 * All ML-dependent fields display a clear "not connected" state when null.
 */
export default function AnalysisResult({ result, onReset }) {
  if (!result) return null

  const domain  = extractDomain(result.url)
  const mlReady = result.status === 'analyzed'
  const isError = result.status === 'error'

  return (
    <motion.div
      className="ar-container"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="ar-header">
        <div className="ar-header-left">
          <div className="ar-domain-badge">
            <Globe size={14} />
            <span className="mono">{domain}</span>
          </div>
          <div className="ar-url-full mono">{result.url}</div>
          {result.analyzed_at && (
            <div className="ar-timestamp">
              <Clock size={11} /> {formatRelativeTime(result.analyzed_at)}
            </div>
          )}
        </div>
        <button className="btn btn-ghost ar-reset-btn" onClick={onReset}>
          <RotateCcw size={14} />
          <span>New Scan</span>
        </button>
      </div>

      {/* ── ML not connected notice ─────────────────────────────────────────── */}
      {!mlReady && !isError && (
        <div className="ar-ml-notice">
          <div className="ar-ml-notice-icon"><Cpu size={16} /></div>
          <div>
            <div className="ar-ml-notice-title">Machine Learning Model Not Connected</div>
            <div className="ar-ml-notice-desc">{result.message}</div>
          </div>
        </div>
      )}

      {/* ── Main grid ──────────────────────────────────────────────────────── */}
      <div className="ar-grid">
        {/* Classification */}
        <div className="glass ar-classification-card">
          <div className="ar-section-label">Classification</div>
          {mlReady && result.classification ? (
            <div className={`ar-classification ar-classification--${result.classification}`}>
              {result.classification === 'phishing'
                ? <><AlertTriangle size={22} /> Phishing</>
                : <><CheckCircle size={22} /> Legitimate</>
              }
            </div>
          ) : (
            <div className="ar-classification ar-classification--pending">
              <Shield size={22} />
              <span>Awaiting ML Model</span>
            </div>
          )}
          <div className="ar-section-note">
            {mlReady ? 'Random Forest prediction' : 'Model not connected'}
          </div>
        </div>

        {/* Risk Score */}
        <div className="glass ar-risk-card">
          <div className="ar-section-label">Risk Score</div>
          <RiskScore score={result.risk_score} />
        </div>

        {/* Confidence */}
        <div className="glass ar-confidence-card">
          <div className="ar-section-label">Model Confidence</div>
          {result.confidence !== null && result.confidence !== undefined ? (
            <div className="ar-confidence-value">
              {Math.round(result.confidence * 100)}%
            </div>
          ) : (
            <div className="ar-pending-value">—</div>
          )}
          <div className="ar-section-note">
            {mlReady ? 'Prediction certainty' : 'Model not connected'}
          </div>
        </div>
      </div>

      {/* ── Feature Analysis ───────────────────────────────────────────────── */}
      <div className="glass ar-features-section">
        <div className="ar-section-title">
          <Info size={15} />
          <span>URL Feature Analysis</span>
        </div>
        <FeatureAnalysis features={result.features} />
      </div>

      {/* ── XAI section ───────────────────────────────────────────────────── */}
      <div className="glass ar-xai-section">
        <div className="ar-section-title">
          <Cpu size={15} />
          <span>Explainable AI — Why was this classified this way?</span>
        </div>
        {mlReady && result.explanations?.length > 0 ? (
          <div>{/* Future: SHAP explanation items */}</div>
        ) : (
          <div className="ar-xai-placeholder">
            <div className="ar-xai-placeholder-icon"><Cpu size={28} /></div>
            <p className="ar-xai-placeholder-text">
              Explainable AI insights will appear here after the Random Forest model is
              connected and SHAP values are computed. Feature importance, contributing
              factors, and model confidence breakdown will be displayed in this section.
            </p>
          </div>
        )}
      </div>

      <style>{`
        .ar-container { display: flex; flex-direction: column; gap: 16px; width: 100%; }

        .ar-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .ar-header-left { display: flex; flex-direction: column; gap: 4px; }
        .ar-domain-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: var(--accent-dim); color: var(--accent);
          border: 1px solid var(--border-accent);
          border-radius: 99px; padding: 4px 12px;
          font-size: 13px; font-weight: 600;
        }
        .ar-url-full {
          font-size: 12px; color: var(--text-muted);
          word-break: break-all; max-width: 520px;
        }
        .ar-timestamp {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: var(--text-muted);
        }
        .ar-reset-btn { flex-shrink: 0; }

        .ar-ml-notice {
          display: flex; align-items: flex-start; gap: 12px;
          background: rgba(251,191,36,.07);
          border: 1px solid rgba(251,191,36,.2);
          border-radius: var(--radius-md);
          padding: 14px 16px;
        }
        .ar-ml-notice-icon {
          color: var(--amber);
          background: var(--amber-dim);
          border-radius: var(--radius-sm);
          padding: 6px; display: flex; align-items: center;
          flex-shrink: 0;
        }
        .ar-ml-notice-title { font-size: 13px; font-weight: 600; color: var(--amber); }
        .ar-ml-notice-desc  { font-size: 12.5px; color: var(--text-secondary); margin-top: 2px; line-height: 1.5; }

        .ar-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 768px) { .ar-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .ar-grid { grid-template-columns: 1fr; } }

        .ar-classification-card,
        .ar-risk-card,
        .ar-confidence-card {
          padding: 20px;
          display: flex; flex-direction: column; gap: 10px;
        }
        .ar-section-label {
          font-size: 11px; font-weight: 600;
          color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase;
        }
        .ar-section-note {
          font-size: 11px; color: var(--text-muted);
        }

        .ar-classification {
          display: flex; align-items: center; gap: 10px;
          font-size: 20px; font-weight: 700;
        }
        .ar-classification--phishing  { color: var(--rose); }
        .ar-classification--legitimate { color: var(--emerald); }
        .ar-classification--pending    { color: var(--text-muted); }

        .ar-confidence-value {
          font-size: 30px; font-weight: 700;
          font-family: var(--font-mono);
          color: var(--accent);
        }
        .ar-pending-value {
          font-size: 30px; font-weight: 700;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }

        .ar-features-section,
        .ar-xai-section {
          padding: 20px;
        }
        .ar-section-title {
          display: flex; align-items: center; gap: 8px;
          font-size: 13px; font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 16px;
        }

        .ar-xai-placeholder {
          display: flex; flex-direction: column; align-items: center;
          gap: 12px; padding: 32px 24px; text-align: center;
        }
        .ar-xai-placeholder-icon { color: var(--text-muted); opacity: 0.4; }
        .ar-xai-placeholder-text {
          font-size: 13px; color: var(--text-muted);
          max-width: 480px; line-height: 1.7;
        }
      `}</style>
    </motion.div>
  )
}
