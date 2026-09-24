import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { touches, type TouchType } from '../../data/touches'
import { db } from '../../firebase/config'
import type { TouchEvent } from '../../types/models'
import { writeDailyGameActionIfNeeded } from '../game/gameService'

const validTouchTypes = new Set<string>(touches.map((touch) => touch.id))

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export async function sendTouch(
  coupleId: string,
  fromUid: string,
  toUid: string,
  type: TouchType,
) {
  if (!fromUid || !toUid || fromUid === toUid) {
    throw new Error('Второй человек ещё не подключён')
  }

  if (!validTouchTypes.has(type)) {
    throw new Error('Неизвестная реакция')
  }

  const firestore = requireDb()
  const now = Date.now()
  const touchRef = doc(collection(firestore, 'couples', coupleId, 'touches'))

  await runTransaction(firestore, async (transaction) => {
    await writeDailyGameActionIfNeeded(
      transaction,
      firestore,
      coupleId,
      fromUid,
      'touch_daily',
      touchRef.id,
      now,
    )

    transaction.set(touchRef, {
      fromUid,
      toUid,
      type,
      createdAt: serverTimestamp(),
      createdAtClientMs: now,
      seenAt: null,
      seenAtClientMs: null,
    })
  })
}

export async function markTouchSeen(coupleId: string, touchId: string) {
  const firestore = requireDb()
  await updateDoc(doc(firestore, 'couples', coupleId, 'touches', touchId), {
    seenAt: serverTimestamp(),
    seenAtClientMs: Date.now(),
  })
}

export function subscribeToTouches(
  coupleId: string,
  onChange: (events: TouchEvent[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  const touchesQuery = query(
    collection(firestore, 'couples', coupleId, 'touches'),
    orderBy('createdAtClientMs', 'desc'),
    limit(30),
  )

  return onSnapshot(
    touchesQuery,
    (snapshot) => {
      const next = snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<TouchEvent, 'id'>),
      }))
      onChange(next)
    },
    () => onError?.('Не удалось синхронизировать касания'),
  )
}
