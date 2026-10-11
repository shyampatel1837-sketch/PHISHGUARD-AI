/**
 * useHealthCheck — polls the backend health endpoint on mount.
 * Used in the sidebar and dashboard to show system status.
 */

import { useState, useEffect } from 'react'
import { checkHealth } from '../services/api'

export function useHealthCheck() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const data = await checkHealth()
        if (!cancelled) {
          setHealth(data)
          setOnline(true)
        }
      } catch {
        if (!cancelled) {
          setHealth(null)
          setOnline(false)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    check()
    const intervalId = window.setInterval(check, 10000)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [])

  return { health, loading, online }
}
