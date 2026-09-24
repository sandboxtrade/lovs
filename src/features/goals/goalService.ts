import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  limit,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { Goal, GoalContribution } from '../../types/models'
import { writeDailyGameActionIfNeeded } from '../game/gameService'

const MAX_TITLE_LENGTH = 80
const MAX_NOTE_LENGTH = 100
const MAX_TARGET = 100_000_000
const MAX_CONTRIBUTION = 10_000_000

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export async function createGoal(
  coupleId: string,
  uid: string,
  title: string,
  target: number,
) {
  const normalizedTitle = title.trim().slice(0, MAX_TITLE_LENGTH)
  const normalizedTarget = Math.round(target)

  if (!normalizedTitle) throw new Error('Введите название цели')
  if (!Number.isFinite(normalizedTarget) || normalizedTarget < 1) {
    throw new Error('Введите сумму цели')
  }
  if (normalizedTarget > MAX_TARGET) {
    throw new Error('Сумма цели слишком большая')
  }

  const firestore = requireDb()
  const now = Date.now()
  const goalRef = doc(collection(firestore, 'couples', coupleId, 'goals'))

  await runTransaction(firestore, async (transaction) => {
    await writeDailyGameActionIfNeeded(
      transaction,
      firestore,
      coupleId,
      uid,
      'goal_create_daily',
      goalRef.id,
      now,
    )

    transaction.set(goalRef, {
      title: normalizedTitle,
      target: normalizedTarget,
      currency: 'RUB',
      createdBy: uid,
      createdAt: serverTimestamp(),
      createdAtClientMs: now,
    })
  })
}

export async function addContribution(
  coupleId: string,
  goalId: string,
  uid: string,
  amount: number,
  note = '',
) {
  const normalizedAmount = Math.round(amount)
  const normalizedNote = note.trim().slice(0, MAX_NOTE_LENGTH)

  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 1) {
    throw new Error('Введите сумму пополнения')
  }
  if (normalizedAmount > MAX_CONTRIBUTION) {
    throw new Error('Сумма пополнения слишком большая')
  }

  const firestore = requireDb()
  const now = Date.now()
  const contributionRef = doc(
    collection(firestore, 'couples', coupleId, 'goals', goalId, 'contributions'),
  )

  await runTransaction(firestore, async (transaction) => {
    await writeDailyGameActionIfNeeded(
      transaction,
      firestore,
      coupleId,
      uid,
      'contribution_daily',
      goalId,
      now,
    )

    transaction.set(contributionRef, {
      uid,
      amount: normalizedAmount,
      note: normalizedNote,
      createdAt: serverTimestamp(),
      createdAtClientMs: now,
    })
  })
}

export function subscribeToGoals(
  coupleId: string,
  onChange: (goals: Goal[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  const goalsQuery = query(
    collection(firestore, 'couples', coupleId, 'goals'),
    orderBy('createdAtClientMs', 'desc'),
    limit(12),
  )

  return onSnapshot(
    goalsQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Goal, 'id'>),
        })),
      )
    },
    () => onError?.('Не удалось синхронизировать цели'),
  )
}

export function subscribeToGoalContributions(
  coupleId: string,
  goalId: string,
  onChange: (items: GoalContribution[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  const contributionsQuery = query(
    collection(firestore, 'couples', coupleId, 'goals', goalId, 'contributions'),
    orderBy('createdAtClientMs', 'desc'),
  )

  return onSnapshot(
    contributionsQuery,
    (snapshot) => {
      onChange(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<GoalContribution, 'id'>),
        })),
      )
    },
    () => onError?.('Не удалось синхронизировать пополнения'),
  )
}
