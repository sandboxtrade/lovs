import { useEffect, useMemo, useState } from 'react'
import type { GameAction } from '../../types/models'
import { calculateGameProgress } from './gameProgress'
import { subscribeToGameActions } from './gameService'

export function useGameProgress(coupleId: string, memberIds: string[]) {
  const [actions, setActions] = useState<GameAction[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    return subscribeToGameActions(coupleId, setActions, setError)
  }, [coupleId])

  const progress = useMemo(
    () => calculateGameProgress(actions, memberIds),
    [actions, memberIds],
  )

  return { actions, progress, error }
}
