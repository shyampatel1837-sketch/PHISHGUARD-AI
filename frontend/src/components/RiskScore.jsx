import React from 'react'
import { riskLabel, riskColor, formatRiskScore } from '../utils/urlUtils'

/**
 * RiskScore — circular gauge component.
 *
 * Displays a percentage ring with a risk level label.
 * When score is null (ML not connected), shows an "awaiting" state.
 *
 * Props:
 *   score  — float 0.0–1.0 | null
 *   size   — 'sm' | 'md' | 'lg' (default 'md')
 */
export default function RiskScore({ score, size = 'md' }) {
  const isAvailable = score !== null && score !== undefined
  const pct   = isAvailable ? Math.round(score * 100) : 0
  const label = isAvailable ? riskLabel(score) : 'Awaiting ML'
  const color = isAvailable ? riskColor(score) : 'var(--text-muted)'

  // SVG circle params
  const dim     = size === 'sm' ? 64 : size === 'lg' ? 120 : 90
  const stroke  = size === 'sm' ? 5  : size === 'lg' ? 9   : 7
  const radius  = (dim / 2) - stroke - 2
  const circum  = 2 * Math.PI * radius
  const offset  = isAvailable ? circum - (pct / 100) * circum : circum

  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 24 : 18

  return (
    <div className="risk-score-wrapper" style={{ '--rs-color': color }}>
      <svg width={dim} height={dim} viewBox={`0 0 ${dim} ${dim}`} className="risk-score-svg">
        {/* Track */}
        <circle
          cx={dim / 2} cy={dim / 2} r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        {/* Progress */}
        <circle
          cx={dim / 2} cy={dim / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circum}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${dim/2} ${dim/2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.3s' }}
        />
        {/* Centre text */}
        <text
          x="50%" y="50%"
          textAnchor="middle"
          dominantBaseline="central"
          fill={isAvailable ? color : 'var(--text-muted)'}
          fontSize={fontSize}
          fontWeight="700"
          fontFamily="JetBrains Mono, monospace"
        >
          {isAvailable ? `${pct}%` : '—'}
        </text>
      </svg>

      <div className="risk-score-label" style={{ color }}>
        {label}
      </div>

      {!isAvailable && (
        <div className="risk-score-note">Model not connected</div>
      )}

      <style>{`
        .risk-score-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }
        .risk-score-svg {
          filter: drop-shadow(0 0 8px var(--rs-color, transparent));
          opacity: 0.9;
        }
        .risk-score-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .risk-score-note {
          font-size: 10.5px;
          color: var(--text-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
