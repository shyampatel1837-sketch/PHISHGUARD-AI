/**
 * PhishGuard AI — centralised API service.
 *
 * All backend requests go through this file.
 * Components must NOT call fetch() directly — import functions from here.
 *
 * Base URL is controlled by the VITE_API_URL env variable (.env file).
 * Default: http://localhost:8000
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// ── Helpers ──────────────────────────────────────────────────────────────────

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(15_000), // 15 s timeout
  }

  const merged = {
    ...defaultOptions,
    ...options,
    headers: { ...defaultOptions.headers, ...(options.headers || {}) },
  }

  try {
    const response = await fetch(url, merged)

    if (!response.ok) {
      // Try to extract a FastAPI error detail
      let detail = `HTTP ${response.status}`
      try {
        const errBody = await response.json()
        detail = errBody.detail || errBody.message || detail
      } catch {
        /* ignore parse error */
      }
      throw new ApiError(detail, response.status)
    }

    return await response.json()
  } catch (err) {
    if (err instanceof ApiError) throw err

    // Network / timeout errors
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check that the backend is running.', 408)
    }
    if (err.message?.includes('fetch') || err.message?.includes('NetworkError') || err.message?.includes('Failed to fetch')) {
      throw new ApiError(
        'Cannot reach the backend server. Make sure the FastAPI server is running on port 8000.',
        503
      )
    }

    throw new ApiError(err.message || 'An unexpected error occurred.', 500)
  }
}

/** Typed error class so components can distinguish API errors from coding bugs. */
export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Check whether the backend is reachable and get its current status.
 * @returns {Promise<{status: string, version: string, model_status: string}>}
 */
export async function checkHealth() {
  return request('/api/health')
}

/**
 * Submit a URL for phishing analysis.
 * The backend validates the URL string and extracts structural features.
 * ML classification is returned as null until the Random Forest is connected.
 *
 * @param {string} url - The URL to analyse (e.g. "https://example.com")
 * @returns {Promise<AnalysisResult>}
 */
export async function analyzeURL(url) {
  return request('/api/analyze', {
    method: 'POST',
    body: JSON.stringify({ url }),
  })
}

/**
 * Retrieve scan history from the backend.
 * Returns an empty list until a database is connected.
 * @returns {Promise<{success: boolean, scans: ScanRecord[], total: number, message: string}>}
 */
export async function getScans() {
  return request('/api/scans')
}

/**
 * Retrieve aggregate detection statistics.
 * Returns null values until a database is connected.
 * @returns {Promise<StatisticsResponse>}
 */
export async function getStatistics() {
  return request('/api/statistics')
}

/**
 * Get the current ML model connection status and metadata.
 * @returns {Promise<ModelStatusResponse>}
 */
export async function getModelStatus() {
  return request('/api/model/status')
}

// ── JSDoc type hints (helps with IDE autocomplete) ────────────────────────────

/**
 * @typedef {Object} AnalysisResult
 * @property {boolean} success
 * @property {string}  url
 * @property {string}  status            - "ml_not_connected" | "analyzed" | "error"
 * @property {string|null}  classification
 * @property {number|null}  risk_score
 * @property {number|null}  confidence
 * @property {URLFeatures}  features
 * @property {ExplanationItem[]} explanations
 * @property {ModelInfo}    model
 * @property {string}       analyzed_at
 * @property {string}       message
 */

/**
 * @typedef {Object} URLFeatures
 * @property {number|null}  url_length
 * @property {string|null}  domain
 * @property {number|null}  domain_length
 * @property {boolean|null} has_https
 * @property {boolean|null} has_ip_address
 * @property {boolean|null} has_at_symbol
 * @property {number|null}  hyphen_count
 * @property {number|null}  dot_count
 * @property {number|null}  subdomain_count
 * @property {string|null}  tld
 * @property {boolean|null} has_suspicious_keywords
 * @property {string[]}     suspicious_keywords_found
 */
