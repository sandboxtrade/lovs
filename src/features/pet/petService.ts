import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { PetInteractionType, PetState } from '../../types/models'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export async function ensurePetState(coupleId: string, uid: string) {
  const firestore = requireDb()
  const petRef = doc(firestore, 'couples', coupleId, 'pet', 'main')
  const now = Date.now()

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(petRef)
    if (snapshot.exists()) return

    transaction.set(petRef, {
      name: 'Моти',
      lastInteractionType: 'none',
      lastInteractedBy: uid,
      lastInteractionAt: null,
      lastInteractionAtClientMs: 0,
      updatedAt: serverTimestamp(),
      updatedAtClientMs: now,
    })
  })
}

export function subscribeToPet(
  coupleId: string,
  onChange: (state: PetState | null) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    doc(firestore, 'couples', coupleId, 'pet', 'main'),
    (snapshot) => onChange(snapshot.exists() ? snapshot.data() as PetState : null),
    () => onError?.('Не удалось синхронизировать питомца'),
  )
}

export async function interactWithPet(
  coupleId: string,
  uid: string,
  type: PetInteractionType,
) {
  const firestore = requireDb()
  const now = Date.now()
  await updateDoc(doc(firestore, 'couples', coupleId, 'pet', 'main'), {
    lastInteractionType: type,
    lastInteractedBy: uid,
    lastInteractionAt: serverTimestamp(),
    lastInteractionAtClientMs: now,
    updatedAt: serverTimestamp(),
    updatedAtClientMs: now,
  })
}

export async function renamePet(coupleId: string, name: string) {
  const nextName = name.trim().replace(/\s+/g, ' ').slice(0, 20)
  if (!nextName) throw new Error('Введите имя питомца')

  const firestore = requireDb()
  const now = Date.now()
  await updateDoc(doc(firestore, 'couples', coupleId, 'pet', 'main'), {
    name: nextName,
    updatedAt: serverTimestamp(),
    updatedAtClientMs: now,
  })
}
