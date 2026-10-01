/**
 * Client-side URL utilities for PhishGuard AI.
 * These are lightweight helpers — full analysis happens on the backend.
 */

/**
 * Basic client-side URL validation before sending to the backend.
 * Returns { valid: boolean, message: string }
 */
export function validateURL(input) {
  if (!input || !input.trim()) {
    return { valid: false, message: 'Please enter a URL.' }
  }

  const trimmed = input.trim()

  if (trimmed.length > 2048) {
    return { valid: false, message: 'URL is too long (max 2048 characters).' }
  }

  // Allow URLs without scheme — the backend will normalise them
  const withScheme = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`

  try {
    const parsed = new URL(withScheme)
    if (!parsed.hostname || parsed.hostname.length < 3) {
      return { valid: false, message: 'URL does not appear to have a valid domain.' }
    }
    return { valid: true, message: '' }
  } catch {
    return { valid: false, message: 'Please enter a valid URL (e.g. https://example.com).' }
  }
}

/**
 * Truncate a URL for display purposes.
 */
export function truncateURL(url, maxLength = 60) {
  if (!url) return ''
  if (url.length <= maxLength) return url
  return url.slice(0, maxLength - 3) + '…'
}

/**
 * Extract just the domain from a full URL string for display.
 */
export function extractDomain(url) {
  if (!url) return url
  try {
    const withScheme = url.startsWith('http') ? url : `https://${url}`
    return new URL(withScheme).hostname
  } catch {
    return url
  }
}

/**
 * Format a risk score (0–1) as a percentage string.
 */
export function formatRiskScore(score) {
  if (score === null || score === undefined) return null
  return `${Math.round(score * 100)}%`
}

/**
 * Map a risk score to a severity label.
 */
export function riskLabel(score) {
  if (score === null || score === undefined) return 'Unknown'
  if (score >= 0.8) return 'Critical'
  if (score >= 0.6) return 'High'
  if (score >= 0.4) return 'Medium'
  if (score >= 0.2) return 'Low'
  return 'Minimal'
}

/**
 * Map a risk score to a CSS colour token.
 */
export function riskColor(score) {
  if (score === null || score === undefined) return 'var(--text-muted)'
  if (score >= 0.6) return 'var(--rose)'
  if (score >= 0.4) return 'var(--amber)'
  return 'var(--emerald)'
}

/**
 * Format an ISO date string to a human-readable relative time.
 */
export function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now  = new Date()
  const diffMs = now - date

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours   = Math.floor(minutes / 60)
  const days    = Math.floor(hours   / 24)

  if (seconds < 60)  return 'just now'
  if (minutes < 60)  return `${minutes}m ago`
  if (hours   < 24)  return `${hours}h ago`
  return `${days}d ago`
}
