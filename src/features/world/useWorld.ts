import { useEffect, useMemo, useState } from 'react'
import type { EconomyState, GameAction, RoomPurchase } from '../../types/models'
import type { GameProgress } from '../game/gameProgress'
import { GAME_COIN_REWARDS } from '../game/gameService'
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
  const [economyError, setEconomyError] = useState<string | null>(null)
  const [roomError, setRoomError] = useState<string | null>(null)

  useEffect(() => {
    setEconomyError(null)
    setRoomError(null)
    const stopEconomy = subscribeToEconomy(
      coupleId,
      (next) => {
        setEconomy(next)
        setEconomyError(null)
      },
      setEconomyError,
    )
    const stopPurchases = subscribeToRoomPurchases(
      coupleId,
      (next) => {
        setPurchases(next)
        setRoomError(null)
      },
      setRoomError,
    )
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
    error: roomError ?? economyError,
  }
}
