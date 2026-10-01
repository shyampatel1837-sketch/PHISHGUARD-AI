import React from 'react'
import { motion } from 'framer-motion'
import { Shield, Loader2 } from 'lucide-react'

/**
 * ScanningAnimation — displayed while the URL is being analysed.
 *
 * Shows real loading stages from useAnalysis.
 * Does NOT claim ML analysis is happening until the model is connected.
 */
export default function ScanningAnimation({ stages, currentStage, stageIndex }) {
  return (
    <motion.div
      className="scanning-container"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
    >
      {/* Central icon */}
      <div className="scanning-icon-ring">
        <div className="scanning-ring scanning-ring--1" />
        <div className="scanning-ring scanning-ring--2" />
        <div className="scanning-icon">
          <Shield size={28} />
        </div>
      </div>

      {/* Status text */}
      <motion.div
        key={currentStage?.id}
        className="scanning-stage-label"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {currentStage?.label || 'Initialising…'}
      </motion.div>

      {/* Stage progress dots */}
      <div className="scanning-dots">
        {stages.map((stage, i) => (
          <div
            key={stage.id}
            className={`scanning-dot ${
              i < stageIndex ? 'scanning-dot--done' :
              i === stageIndex ? 'scanning-dot--active' :
              ''
            }`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="scanning-progress-track">
        <motion.div
          className="scanning-progress-bar"
          initial={{ width: '0%' }}
          animate={{ width: `${((stageIndex + 1) / stages.length) * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </div>

      <p className="scanning-note">
        Analysing URL string — no network requests to the target site are made.
      </p>

      <style>{`
        .scanning-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          padding: 48px 24px;
        }

        .scanning-icon-ring {
          position: relative;
          width: 90px; height: 90px;
          display: flex; align-items: center; justify-content: center;
        }

        .scanning-ring {
          position: absolute;
          border-radius: 50%;
          border: 1.5px solid var(--accent);
          animation: pulse-ring 2.5s ease-out infinite;
        }
        .scanning-ring--1 { width: 90px; height: 90px; opacity: 0.4; }
        .scanning-ring--2 { width: 70px; height: 70px; opacity: 0.3; animation-delay: 0.8s; }

        .scanning-icon {
          width: 56px; height: 56px;
          background: var(--accent-dim);
          border: 1px solid var(--border-accent);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          color: var(--accent);
          z-index: 1;
        }

        .scanning-stage-label {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          font-family: var(--font-mono);
          text-align: center;
        }

        .scanning-dots {
          display: flex; gap: 6px;
        }
        .scanning-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--border-active);
          transition: all 0.3s;
        }
        .scanning-dot--active {
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
          transform: scale(1.3);
        }
        .scanning-dot--done {
          background: var(--emerald);
        }

        .scanning-progress-track {
          width: 260px; height: 3px;
          background: var(--border);
          border-radius: 99px;
          overflow: hidden;
        }
        .scanning-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #0ea5e9, #38bdf8);
          border-radius: 99px;
        }

        .scanning-note {
          font-size: 11.5px;
          color: var(--text-muted);
          text-align: center;
          max-width: 300px;
          font-style: italic;
        }
      `}</style>
    </motion.div>
  )
}
