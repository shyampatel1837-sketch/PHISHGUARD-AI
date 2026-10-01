/**
 * useAnalysis — manages the URL analysis request lifecycle.
 *
 * Handles loading stages, error states, and result storage.
 * Used by the URL Scanner page.
 */

import { useState, useCallback } from 'react'
import { analyzeURL, ApiError } from '../services/api'

// Loading stages shown in the scanning animation.
// Only stages that correspond to REAL backend operations are listed.
// Do NOT add "Running Random Forest..." until the model is connected.
const LOADING_STAGES = [
  { id: 'validate',  label: 'Validating URL format…',       duration: 600  },
  { id: 'parse',     label: 'Parsing URL structure…',        duration: 700  },
  { id: 'features',  label: 'Extracting URL features…',      duration: 900  },
  { id: 'backend',   label: 'Sending to analysis engine…',   duration: 600  },
  { id: 'ml',        label: 'Awaiting ML model response…',   duration: 500  },
]

export function useAnalysis() {
  const [status, setStatus]       = useState('idle')   // idle | loading | success | error
  const [result, setResult]       = useState(null)
  const [error, setError]         = useState(null)
  const [stageIndex, setStageIndex] = useState(0)
  const [currentStage, setCurrentStage] = useState(null)

  const analyze = useCallback(async (url) => {
    setStatus('loading')
    setResult(null)
    setError(null)
    setStageIndex(0)

    // Animate through loading stages while the real request runs
    let stageTimeout
    const animateStages = async () => {
      for (let i = 0; i < LOADING_STAGES.length; i++) {
        setCurrentStage(LOADING_STAGES[i])
        setStageIndex(i)
        await new Promise(r => { stageTimeout = setTimeout(r, LOADING_STAGES[i].duration) })
      }
    }

    try {
      // Run animation and API call in parallel
      const [data] = await Promise.all([
        analyzeURL(url),
        animateStages(),
      ])

      setResult(data)
      setStatus('success')
      setCurrentStage(null)
    } catch (err) {
      clearTimeout(stageTimeout)
      setCurrentStage(null)

      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setResult(null)
    setError(null)
    setStageIndex(0)
    setCurrentStage(null)
  }, [])

  return {
    analyze,
    reset,
    status,
    result,
    error,
    stageIndex,
    currentStage,
    stages: LOADING_STAGES,
    isLoading: status === 'loading',
    isSuccess: status === 'success',
    isError:   status === 'error',
  }
}
