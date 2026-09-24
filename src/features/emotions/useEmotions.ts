import { useEffect, useState } from 'react'
import type { EmotionState } from '../../types/models'
import { subscribeToEmotions } from './emotionService'

export function useEmotions(coupleId: string) {
  const [states, setStates] = useState<Record<string, EmotionState>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    return subscribeToEmotions(coupleId, setStates, setError)
  }, [coupleId])

  return { states, error }
}
