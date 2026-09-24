import { useEffect, useMemo, useState } from 'react'
import type { GameAction, PetState } from '../../types/models'
import type { GameProgress } from '../game/gameProgress'
import { calculatePetView } from './petLogic'
import { ensurePetState, subscribeToPet } from './petService'

export function usePet(
  coupleId: string,
  uid: string,
  memberIds: string[],
  actions: GameAction[],
  progress: GameProgress,
) {
  const [state, setState] = useState<PetState | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    void ensurePetState(coupleId, uid).catch(() => setError('Не удалось создать состояние питомца'))
    return subscribeToPet(coupleId, setState, setError)
  }, [coupleId, uid])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const view = useMemo(
    () => calculatePetView(state, actions, progress, memberIds, now),
    [state, actions, progress, memberIds, now],
  )

  return { state, view, error }
}
