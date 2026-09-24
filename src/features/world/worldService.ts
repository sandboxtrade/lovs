import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { getRoomItem, type RoomItemId } from '../../data/roomItems'
import { db } from '../../firebase/config'
import type { EconomyState, RoomPurchase } from '../../types/models'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export function subscribeToEconomy(
  coupleId: string,
  onChange: (state: EconomyState) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    doc(firestore, 'couples', coupleId, 'economy', 'main'),
    (snapshot) => {
      if (!snapshot.exists()) {
        onChange({ spentCoins: 0, updatedAtClientMs: 0 })
        return
      }
      onChange(snapshot.data() as EconomyState)
    },
    () => onError?.('Не удалось синхронизировать монеты'),
  )
}

export function subscribeToRoomPurchases(
  coupleId: string,
  onChange: (items: RoomPurchase[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  const purchasesQuery = query(
    collection(firestore, 'couples', coupleId, 'roomPurchases'),
    orderBy('purchasedAtClientMs', 'asc'),
  )

  return onSnapshot(
    purchasesQuery,
    (snapshot) => {
      onChange(snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<RoomPurchase, 'id'>),
      })))
    },
    () => onError?.('Не удалось синхронизировать комнату'),
  )
}

export async function buyRoomItem(
  coupleId: string,
  uid: string,
  itemId: RoomItemId,
  earnedCoins: number,
) {
  const item = getRoomItem(itemId)
  if (!item) throw new Error('Предмет не найден')

  const firestore = requireDb()
  const purchaseRef = doc(firestore, 'couples', coupleId, 'roomPurchases', itemId)
  const economyRef = doc(firestore, 'couples', coupleId, 'economy', 'main')
  const now = Date.now()

  await runTransaction(firestore, async (transaction) => {
    const [purchaseSnapshot, economySnapshot] = await Promise.all([
      transaction.get(purchaseRef),
      transaction.get(economyRef),
    ])

    if (purchaseSnapshot.exists()) throw new Error('Этот предмет уже есть в вашей комнате')

    const currentSpent = economySnapshot.exists()
      ? Number((economySnapshot.data() as EconomyState).spentCoins ?? 0)
      : 0

    if (earnedCoins - currentSpent < item.price) {
      throw new Error('Пока не хватает монет')
    }

    transaction.set(economyRef, {
      spentCoins: currentSpent + item.price,
      updatedAt: serverTimestamp(),
      updatedAtClientMs: now,
    })

    transaction.set(purchaseRef, {
      itemId: item.id,
      cost: item.price,
      purchasedBy: uid,
      purchasedAt: serverTimestamp(),
      purchasedAtClientMs: now,
    })
  })
}
