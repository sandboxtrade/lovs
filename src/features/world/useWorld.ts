import { useEffect, useMemo, useState } from 'react'
import type { EconomyState, RoomPurchase } from '../../types/models'
import type { GameProgress } from '../game/gameProgress'
import { GAME_COIN_REWARDS } from '../game/gameService'
import type { GameAction } from '../../types/models'
import { subscribeToEconomy, subscribeToRoomPurchases } from './worldService'

function calculateEarnedCoins(actions: GameAction[], progress: GameProgress) {
  const actionCoins = actions.reduce((sum, action) => sum + (GAME_COIN_REWARDS[action.type] ?? 0), 0)
  const pairBonusCoins = Math.floor(progress.pairBonusXp / 15) * 5
  return actionCoins + pairBonusCoins
}

export function useWorld(
  coupleId: string,
  actions: GameAction[],
  progress: GameProgress,
) {
  const [economy, setEconomy] = useState<EconomyState>({ spentCoins: 0, updatedAtClientMs: 0 })
  const [purchases, setPurchases] = useState<RoomPurchase[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    const stopEconomy = subscribeToEconomy(coupleId, setEconomy, setError)
    const stopPurchases = subscribeToRoomPurchases(coupleId, setPurchases, setError)
    return () => {
      stopEconomy()
      stopPurchases()
    }
  }, [coupleId])

  const earnedCoins = useMemo(
    () => calculateEarnedCoins(actions, progress),
    [actions, progress],
  )
  const availableCoins = Math.max(0, earnedCoins - economy.spentCoins)
  const ownedItemIds = useMemo(
    () => new Set(purchases.map((item) => item.itemId)),
    [purchases],
  )

  return {
    economy,
    purchases,
    earnedCoins,
    availableCoins,
    ownedItemIds,
    error,
  }
}
