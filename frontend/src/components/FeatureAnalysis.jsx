import React from 'react'
import { CheckCircle2, XCircle, AlertCircle, Minus } from 'lucide-react'

/**
 * FeatureAnalysis — renders the extracted URL features as a grid of items.
 *
 * Props:
 *   features — URLFeatures object from the API response
 *
 * NOTE: These are the initial placeholder features. Once the Random Forest
 * training pipeline is finalised, update this component to match the exact
 * features used during training.
 */

function FeatureItem({ label, value, status }) {
  // status: 'good' | 'bad' | 'neutral' | 'unknown'
  const icons = {
    good:    <CheckCircle2 size={14} color="var(--emerald)" />,
    bad:     <XCircle     size={14} color="var(--rose)" />,
    neutral: <AlertCircle size={14} color="var(--amber)" />,
    unknown: <Minus       size={14} color="var(--text-muted)" />,
  }

  const colors = {
    good:    'var(--emerald)',
    bad:     'var(--rose)',
    neutral: 'var(--amber)',
    unknown: 'var(--text-muted)',
  }

  return (
    <div className="fi-item">
      <div className="fi-label">{label}</div>
      <div className="fi-value-row">
        {icons[status] || icons.unknown}
        <span className="fi-value" style={{ color: colors[status] || colors.unknown }}>
          {value ?? '—'}
        </span>
      </div>

      <style>{`
        .fi-item {
          background: var(--bg-elevated);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          display: flex; flex-direction: column; gap: 6px;
        }
        .fi-label {
          font-size: 11px; font-weight: 600;
          color: var(--text-muted); letter-spacing: 0.05em; text-transform: uppercase;
        }
        .fi-value-row { display: flex; align-items: center; gap: 6px; }
        .fi-value { font-size: 13px; font-weight: 600; font-family: var(--font-mono); }
      `}</style>
    </div>
  )
}

function boolStatus(val, goodIsTrue = true) {
  if (val === null || val === undefined) return 'unknown'
  if (goodIsTrue) return val ? 'good' : 'bad'
  return val ? 'bad' : 'good'
}

export default function FeatureAnalysis({ features }) {
  if (!features) {
    return (
      <div className="empty-state">
        <div className="empty-state-title">No feature data available</div>
      </div>
    )
  }

  const items = [
    {
      label:  'HTTPS',
      value:  features.has_https === null ? null : features.has_https ? 'Yes' : 'No',
      status: boolStatus(features.has_https, true),
    },
    {
      label:  'URL Length',
      value:  features.url_length,
      status: features.url_length === null ? 'unknown'
              : features.url_length > 100 ? 'bad'
              : features.url_length > 54  ? 'neutral'
              : 'good',
    },
    {
      label:  'Domain',
      value:  features.domain || '—',
      status: features.domain ? 'good' : 'unknown',
    },
    {
      label:  'Domain Length',
      value:  features.domain_length,
      status: features.domain_length === null ? 'unknown'
              : features.domain_length > 30 ? 'bad'
              : 'good',
    },
    {
      label:  'IP Address',
      value:  features.has_ip_address === null ? null : features.has_ip_address ? 'Yes' : 'No',
      status: boolStatus(features.has_ip_address, false),   // IP in URL = bad
    },
    {
      label:  '@ Symbol',
      value:  features.has_at_symbol === null ? null : features.has_at_symbol ? 'Yes' : 'No',
      status: boolStatus(features.has_at_symbol, false),    // @ in URL = bad
    },
    {
      label:  'Hyphens',
      value:  features.hyphen_count,
      status: features.hyphen_count === null ? 'unknown'
              : features.hyphen_count > 3 ? 'bad'
              : features.hyphen_count > 1 ? 'neutral'
              : 'good',
    },
    {
      label:  'Dots',
      value:  features.dot_count,
      status: features.dot_count === null ? 'unknown'
              : features.dot_count > 5 ? 'bad'
              : 'good',
    },
    {
      label:  'Subdomains',
      value:  features.subdomain_count,
      status: features.subdomain_count === null ? 'unknown'
              : features.subdomain_count > 2 ? 'bad'
              : features.subdomain_count > 1 ? 'neutral'
              : 'good',
    },
    {
      label:  'Query Params',
      value:  features.query_params,
      status: features.query_params === null ? 'unknown'
              : features.query_params > 4 ? 'neutral'
              : 'good',
    },
    {
      label:  'TLD',
      value:  features.tld ? `.${features.tld}` : '—',
      status: features.tld ? 'good' : 'unknown',
    },
    {
      label:  'Suspicious Keywords',
      value:  features.has_suspicious_keywords === null ? null
              : features.has_suspicious_keywords
                ? (features.suspicious_keywords_found?.join(', ') || 'Yes')
                : 'None found',
      status: boolStatus(features.has_suspicious_keywords, false),
    },
  ]

  return (
    <div className="fa-grid">
      {items.map(item => (
        <FeatureItem key={item.label} {...item} />
      ))}

      <div className="fa-disclaimer">
        ⚠ These features are preliminary. The final feature set will match the Random Forest training pipeline.
      </div>

      <style>{`
        .fa-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
          gap: 10px;
        }
        .fa-disclaimer {
          grid-column: 1 / -1;
          font-size: 11px; color: var(--text-muted);
          font-style: italic; padding-top: 4px;
        }
      `}</style>
    </div>
  )
}
