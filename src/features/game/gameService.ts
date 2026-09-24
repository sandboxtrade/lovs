import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Firestore,
  type Transaction,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { GameAction, GameActionType } from '../../types/models'

export const GAME_REWARDS: Record<GameActionType, number> = {
  emotion_daily: 10,
  touch_daily: 8,
  goal_create_daily: 25,
  contribution_daily: 15,
  question_daily: 12,
  choice_daily: 12,
  quest_daily: 18,
}

export const GAME_COIN_REWARDS: Record<GameActionType, number> = {
  emotion_daily: 4,
  touch_daily: 3,
  goal_create_daily: 10,
  contribution_daily: 6,
  question_daily: 5,
  choice_daily: 5,
  quest_daily: 8,
}

export function getDayKey(now = Date.now()) {
  const date = new Date(now)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function buildGameAction(
  firestore: Firestore,
  coupleId: string,
  uid: string,
  type: GameActionType,
  sourceId: string,
  now = Date.now(),
) {
  const dayKey = getDayKey(now)
  const id = `${type}_${dayKey}_${uid}`
  const ref = doc(firestore, 'couples', coupleId, 'gameActions', id)
  const data = {
    uid,
    type,
    dayKey,
    sourceId: sourceId.slice(0, 120),
    createdAt: serverTimestamp(),
    createdAtClientMs: now,
  }
  return { ref, data }
}

export async function writeDailyGameActionIfNeeded(
  transaction: Transaction,
  firestore: Firestore,
  coupleId: string,
  uid: string,
  type: GameActionType,
  sourceId: string,
  now = Date.now(),
) {
  const action = buildGameAction(firestore, coupleId, uid, type, sourceId, now)
  const snapshot = await transaction.get(action.ref)
  if (!snapshot.exists()) transaction.set(action.ref, action.data)
}

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export function subscribeToGameActions(
  coupleId: string,
  onChange: (actions: GameAction[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  const actionsQuery = query(
    collection(firestore, 'couples', coupleId, 'gameActions'),
    orderBy('createdAtClientMs', 'asc'),
  )

  return onSnapshot(
    actionsQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<GameAction, 'id'>),
        })),
      )
    },
    () => onError?.('Не удалось синхронизировать игровой прогресс'),
  )
}
