import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Info, Zap } from 'lucide-react'
import URLInput from '../components/URLInput'
import ScanningAnimation from '../components/ScanningAnimation'
import AnalysisResult from '../components/AnalysisResult'
import { useAnalysis } from '../hooks/useAnalysis'

export default function Scanner() {
  const location  = useLocation()
  const { analyze, reset, status, result, error, stageIndex, currentStage, stages, isLoading } = useAnalysis()

  // If navigated here from the dashboard quick-scan, auto-run the URL
  useEffect(() => {
    const url = location.state?.url
    if (url) {
      analyze(url)
      // Clear state so a page refresh doesn't re-run
      window.history.replaceState({}, document.title)
    }
  }, []) // eslint-disable-line

  return (
    <div className="scanner-page">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="scanner-header"
      >
        <div className="scanner-header-icon">
          <Shield size={22} />
        </div>
        <div>
          <h1 className="page-title">URL Scanner</h1>
          <p className="page-subtitle">
            Analyse any URL for phishing indicators using structural analysis
          </p>
        </div>
      </motion.div>

      {/* ── Input card ──────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="glass scanner-input-card"
      >
        <div className="scanner-input-header">
          <Zap size={14} color="var(--accent)" />
          <span>Enter a URL to analyze</span>
        </div>

        <URLInput
          onSubmit={analyze}
          loading={isLoading}
        />

        <div className="scanner-hint">
          <Info size={12} />
          <span>
            Analysis is performed on the URL string only. The target website is
            never visited. ML classification is pending model integration.
          </span>
        </div>
      </motion.div>

      {/* ── Scanning animation ──────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="scanning"
            className="glass scanner-result-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <ScanningAnimation
              stages={stages}
              currentStage={currentStage}
              stageIndex={stageIndex}
            />
          </motion.div>
        )}

        {/* ── Error state ───────────────────────────────────────────────────── */}
        {status === 'error' && (
          <motion.div
            key="error"
            className="glass scanner-error-card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="scanner-error-icon">⚠</div>
            <div className="scanner-error-title">Analysis Failed</div>
            <div className="scanner-error-msg">{error}</div>
            <button className="btn btn-ghost" onClick={reset}>Try Again</button>
          </motion.div>
        )}

        {/* ── Result ────────────────────────────────────────────────────────── */}
        {status === 'success' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <AnalysisResult result={result} onReset={reset} />
          </motion.div>
        )}

        {/* ── Idle state ────────────────────────────────────────────────────── */}
        {status === 'idle' && (
          <motion.div
            key="idle"
            className="glass scanner-idle-card"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="scanner-idle-grid">
              {EXAMPLE_URLS.map((ex) => (
                <button
                  key={ex.url}
                  className="scanner-example-btn"
                  onClick={() => analyze(ex.url)}
                >
                  <div className="scanner-example-url">{ex.url}</div>
                  <div className="scanner-example-label">{ex.label}</div>
                </button>
              ))}
            </div>
            <div className="scanner-idle-note">
              Click an example above or enter your own URL in the field above.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .scanner-page { display: flex; flex-direction: column; gap: 20px; max-width: 900px; }

        .scanner-header { display: flex; align-items: center; gap: 14px; }
        .scanner-header-icon {
          width: 48px; height: 48px;
          background: var(--accent-dim);
          border: 1px solid var(--border-accent);
          border-radius: var(--radius-lg);
          display: flex; align-items: center; justify-content: center;
          color: var(--accent); flex-shrink: 0;
        }

        .scanner-input-card { padding: 24px; display: flex; flex-direction: column; gap: 12px; }
        .scanner-input-header {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px; font-weight: 600;
          color: var(--text-muted); letter-spacing: 0.05em; text-transform: uppercase;
        }
        .scanner-hint {
          display: flex; align-items: flex-start; gap: 6px;
          font-size: 12px; color: var(--text-muted); line-height: 1.5;
        }
        .scanner-hint svg { flex-shrink: 0; margin-top: 1px; }

        .scanner-result-area { overflow: hidden; }

        .scanner-error-card {
          padding: 40px 24px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
          text-align: center;
        }
        .scanner-error-icon { font-size: 32px; }
        .scanner-error-title { font-size: 16px; font-weight: 700; color: var(--rose); }
        .scanner-error-msg   { font-size: 13px; color: var(--text-secondary); max-width: 420px; }

        .scanner-idle-card { padding: 24px; }
        .scanner-idle-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
          margin-bottom: 16px;
        }
        .scanner-example-btn {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          text-align: left; cursor: pointer;
          transition: all var(--transition);
          display: flex; flex-direction: column; gap: 4px;
        }
        .scanner-example-btn:hover {
          border-color: var(--border-accent);
          background: var(--accent-dim);
        }
        .scanner-example-url {
          font-size: 12px; font-family: var(--font-mono);
          color: var(--accent); word-break: break-all;
        }
        .scanner-example-label {
          font-size: 11px; color: var(--text-muted);
        }
        .scanner-idle-note {
          font-size: 12px; color: var(--text-muted);
          text-align: center; font-style: italic;
        }
      `}</style>
    </div>
  )
}

const EXAMPLE_URLS = [
  { url: 'https://github.com',          label: 'Popular legitimate site' },
  { url: 'https://www.wikipedia.org',   label: 'Educational site' },
  { url: 'http://paypal-verify.xyz',    label: 'Suspicious domain' },
  { url: 'https://login-account.info',  label: 'Phishing-style URL' },
  { url: 'https://docs.python.org',     label: 'Documentation site' },
  { url: 'http://192.168.1.1/login',    label: 'IP-based URL' },
]
