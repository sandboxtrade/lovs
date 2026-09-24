import {
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { Couple, UserProfile } from '../../types/models'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export async function createCouple(profile: UserProfile) {
  const firestore = requireDb()
  const coupleRef = doc(collection(firestore, 'couples'))

  const couple: Omit<Couple, 'createdAt' | 'updatedAt'> = {
    id: coupleRef.id,
    name: 'Мы',
    createdBy: profile.uid,
    memberIds: [profile.uid],
    members: {
      [profile.uid]: {
        uid: profile.uid,
        displayName: profile.displayName,
      },
    },
  }

  const batch = writeBatch(firestore)
  batch.set(coupleRef, {
    ...couple,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(firestore, 'users', profile.uid), {
    coupleId: coupleRef.id,
    updatedAt: serverTimestamp(),
  })
  await batch.commit()

  return { ...couple, inviteCode: coupleRef.id }
}

export async function joinCouple(profile: UserProfile, rawCode: string) {
  const firestore = requireDb()
  const code = rawCode.trim()
  if (!code) throw new Error('Введите код пространства')

  const coupleRef = doc(firestore, 'couples', code)

  // Joining does not require reading the couple first. Security rules verify that
  // the current user is the only member being appended and that there is one slot.
  const batch = writeBatch(firestore)
  batch.update(coupleRef, {
    memberIds: arrayUnion(profile.uid),
    [`members.${profile.uid}`]: {
      uid: profile.uid,
      displayName: profile.displayName,
    },
    updatedAt: serverTimestamp(),
  })
  batch.update(doc(firestore, 'users', profile.uid), {
    coupleId: code,
    updatedAt: serverTimestamp(),
  })
  await batch.commit()

  return code
}

export async function getCouple(coupleId: string): Promise<Couple> {
  const firestore = requireDb()
  const snapshot = await getDoc(doc(firestore, 'couples', coupleId))
  if (!snapshot.exists()) throw new Error('Пространство не найдено')
  return snapshot.data() as Couple
}

export function subscribeToCouple(
  coupleId: string,
  onChange: (couple: Couple) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()

  return onSnapshot(
    doc(firestore, 'couples', coupleId),
    (snapshot) => {
      if (!snapshot.exists()) {
        onError?.('Пространство больше не существует')
        return
      }
      onChange(snapshot.data() as Couple)
    },
    () => onError?.('Не удалось синхронизировать пространство'),
  )
}
