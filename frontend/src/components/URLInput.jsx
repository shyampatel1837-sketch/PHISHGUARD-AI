import React, { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, AlertCircle, Globe } from 'lucide-react'
import { validateURL } from '../utils/urlUtils'

/**
 * URLInput — the main URL submission form.
 *
 * Props:
 *   onSubmit  (url: string) => void
 *   loading   boolean
 *   compact   boolean — smaller variant for the dashboard quick-scan
 */
export default function URLInput({ onSubmit, loading = false, compact = false }) {
  const [value, setValue]     = useState('')
  const [error, setError]     = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  function handleChange(e) {
    setValue(e.target.value)
    if (error) setError('')
  }

  function handleSubmit(e) {
    e.preventDefault()
    const { valid, message } = validateURL(value)
    if (!valid) {
      setError(message)
      inputRef.current?.focus()
      return
    }
    setError('')
    onSubmit(value.trim())
  }

  function handleClear() {
    setValue('')
    setError('')
    inputRef.current?.focus()
  }

  const hasValue = value.length > 0

  return (
    <form onSubmit={handleSubmit} className={`url-form ${compact ? 'url-form--compact' : ''}`}>
      <div className={`url-input-wrapper ${focused ? 'url-input-wrapper--focused' : ''} ${error ? 'url-input-wrapper--error' : ''}`}>
        {/* Left icon */}
        <Globe
          size={compact ? 16 : 18}
          className="url-input-icon-left"
          style={{ color: focused ? 'var(--accent)' : 'var(--text-muted)' }}
        />

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={compact ? 'Enter a URL to scan…' : 'Enter a website URL to analyze… (e.g. https://example.com)'}
          className="url-input"
          disabled={loading}
          maxLength={2048}
          autoComplete="off"
          spellCheck={false}
          aria-label="URL to analyze"
        />

        {/* Clear button */}
        <AnimatePresence>
          {hasValue && !loading && (
            <motion.button
              type="button"
              className="url-input-clear"
              onClick={handleClear}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={{ duration: 0.15 }}
              aria-label="Clear input"
            >
              <X size={14} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Analyse button */}
        <button
          type="submit"
          className={`url-submit-btn ${compact ? 'url-submit-btn--compact' : ''}`}
          disabled={loading || !hasValue}
        >
          {loading ? (
            <span className="url-submit-spinner" />
          ) : (
            <Search size={compact ? 14 : 16} />
          )}
          {!compact && <span>{loading ? 'Analyzing…' : 'Analyze URL'}</span>}
        </button>
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="url-error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <AlertCircle size={13} />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .url-form { width: 100%; display: flex; flex-direction: column; gap: 8px; }

        .url-input-wrapper {
          display: flex;
          align-items: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 6px 6px 6px 16px;
          transition: border-color var(--transition), box-shadow var(--transition);
          gap: 8px;
        }
        .url-form--compact .url-input-wrapper {
          border-radius: var(--radius-md);
          padding: 4px 4px 4px 12px;
        }
        .url-input-wrapper--focused {
          border-color: var(--border-accent);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }
        .url-input-wrapper--error {
          border-color: var(--rose);
          box-shadow: 0 0 0 3px rgba(251,113,133,.15);
        }

        .url-input-icon-left { flex-shrink: 0; transition: color var(--transition); }

        .url-input {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 15px;
          font-family: var(--font-mono);
          min-width: 0;
          padding: 8px 0;
        }
        .url-form--compact .url-input { font-size: 13px; padding: 6px 0; }
        .url-input::placeholder { color: var(--text-muted); font-family: var(--font-sans); }
        .url-input:disabled { opacity: 0.6; }

        .url-input-clear {
          background: transparent; border: none;
          color: var(--text-muted); cursor: pointer;
          padding: 4px; display: flex; align-items: center;
          border-radius: 4px; flex-shrink: 0;
          transition: color var(--transition);
        }
        .url-input-clear:hover { color: var(--text-secondary); }

        .url-submit-btn {
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #0ea5e9, #38bdf8);
          color: #0c1929;
          border: none; border-radius: var(--radius-md);
          padding: 10px 20px;
          font-size: 14px; font-weight: 700;
          cursor: pointer; flex-shrink: 0;
          transition: all var(--transition);
          white-space: nowrap;
        }
        .url-submit-btn--compact { padding: 8px 14px; font-size: 13px; }
        .url-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #38bdf8, #7dd3fc);
          box-shadow: 0 0 20px rgba(56,189,248,.35);
        }
        .url-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .url-submit-spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(12,25,41,.3);
          border-top-color: #0c1929;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          flex-shrink: 0;
        }

        .url-error {
          display: flex; align-items: center; gap: 6px;
          font-size: 12px; color: var(--rose);
          padding-left: 4px;
        }
      `}</style>
    </form>
  )
}
