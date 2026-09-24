import {
  collection,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { emotions, type EmotionId } from '../../data/emotions'
import { db } from '../../firebase/config'
import type { EmotionState } from '../../types/models'
import { writeDailyGameActionIfNeeded } from '../game/gameService'

const MAX_NOTE_LENGTH = 140
const validEmotionIds = new Set<string>(emotions.map((emotion) => emotion.id))

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

type SaveEmotionInput = {
  emotionId: EmotionId
  intensity: number
  note: string
}

export async function saveEmotion(
  coupleId: string,
  uid: string,
  input: SaveEmotionInput,
) {
  if (!validEmotionIds.has(input.emotionId)) {
    throw new Error('Выберите состояние')
  }

  const intensity = Math.round(Math.min(100, Math.max(0, input.intensity)))
  const note = input.note.trim().slice(0, MAX_NOTE_LENGTH)
  const firestore = requireDb()
  const now = Date.now()
  const emotionRef = doc(firestore, 'couples', coupleId, 'emotions', uid)

  await runTransaction(firestore, async (transaction) => {
    await writeDailyGameActionIfNeeded(
      transaction,
      firestore,
      coupleId,
      uid,
      'emotion_daily',
      uid,
      now,
    )

    transaction.set(
      emotionRef,
      {
        uid,
        emotionId: input.emotionId,
        intensity,
        note,
        updatedAt: serverTimestamp(),
        updatedAtClientMs: now,
      },
      { merge: true },
    )
  })
}

export function subscribeToEmotions(
  coupleId: string,
  onChange: (states: Record<string, EmotionState>) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()

  return onSnapshot(
    collection(firestore, 'couples', coupleId, 'emotions'),
    (snapshot) => {
      const next: Record<string, EmotionState> = {}
      snapshot.forEach((item) => {
        next[item.id] = item.data() as EmotionState
      })
      onChange(next)
    },
    () => onError?.('Не удалось синхронизировать эмоции'),
  )
}
