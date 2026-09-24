import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  doc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { PlanOption, PlanScope } from '../../types/models'

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

function optionsRef(coupleId: string, scope: PlanScope) {
  return collection(requireDb(), 'couples', coupleId, 'plans', scope, 'options')
}

export function subscribeToPlanOptions(
  coupleId: string,
  scope: PlanScope,
  onChange: (options: PlanOption[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  return onSnapshot(
    query(optionsRef(coupleId, scope), orderBy('createdAtClientMs', 'desc')),
    (snapshot) => onChange(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as PlanOption))),
    () => onError?.('Не удалось синхронизировать планы'),
  )
}

export async function addPlanOption(coupleId: string, scope: PlanScope, uid: string, text: string) {
  const value = text.trim()
  if (!value) throw new Error('Напиши вариант')
  if (value.length > 120) throw new Error('Слишком длинный вариант')
  await addDoc(optionsRef(coupleId, scope), {
    text: value,
    createdBy: uid,
    ratings: {},
    createdAt: serverTimestamp(),
    createdAtClientMs: Date.now(),
  })
}

export async function ratePlanOption(coupleId: string, scope: PlanScope, optionId: string, uid: string, rating: number) {
  const safeRating = Math.max(1, Math.min(5, Math.round(rating)))
  await updateDoc(doc(requireDb(), 'couples', coupleId, 'plans', scope, 'options', optionId), {
    [`ratings.${uid}`]: safeRating,
  })
}
