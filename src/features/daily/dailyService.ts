import {
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type {
  DailyChoiceAnswer,
  DailyQuestionAnswer,
  DailyQuestCompletion,
} from '../../types/models'
import { writeDailyGameActionIfNeeded } from '../game/gameService'

const MAX_ANSWER_LENGTH = 500

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

export async function submitDailyQuestion(
  coupleId: string,
  uid: string,
  dayKey: string,
  answer: string,
) {
  const normalized = answer.trim().slice(0, MAX_ANSWER_LENGTH)
  if (!normalized) throw new Error('Напиши хотя бы пару слов')

  const firestore = requireDb()
  const now = Date.now()
  const answerRef = doc(firestore, 'couples', coupleId, 'dailyQuestionAnswers', `${dayKey}_${uid}`)

  await runTransaction(firestore, async (transaction) => {
    const current = await transaction.get(answerRef)
    if (current.exists()) throw new Error('Ответ на сегодня уже сохранён')

    await writeDailyGameActionIfNeeded(
      transaction,
      firestore,
      coupleId,
      uid,
      'question_daily',
      answerRef.id,
      now,
    )

    transaction.set(answerRef, {
      uid,
      dayKey,
      answer: normalized,
      createdAt: serverTimestamp(),
      createdAtClientMs: now,
    })
  })
}

export async function submitDailyChoice(
  coupleId: string,
  uid: string,
  dayKey: string,
  ownChoice: 'a' | 'b',
  partnerGuess: 'a' | 'b',
) {
  const firestore = requireDb()
  const now = Date.now()
  const answerRef = doc(firestore, 'couples', coupleId, 'dailyChoiceAnswers', `${dayKey}_${uid}`)

  await runTransaction(firestore, async (transaction) => {
    const current = await transaction.get(answerRef)
    if (current.exists()) throw new Error('Выбор на сегодня уже сохранён')

    await writeDailyGameActionIfNeeded(
      transaction,
      firestore,
      coupleId,
      uid,
      'choice_daily',
      answerRef.id,
      now,
    )

    transaction.set(answerRef, {
      uid,
      dayKey,
      ownChoice,
      partnerGuess,
      createdAt: serverTimestamp(),
      createdAtClientMs: now,
    })
  })
}

export async function completeDailyQuest(
  coupleId: string,
  uid: string,
  dayKey: string,
) {
  const firestore = requireDb()
  const now = Date.now()
  const completionRef = doc(firestore, 'couples', coupleId, 'dailyQuestCompletions', `${dayKey}_${uid}`)

  await runTransaction(firestore, async (transaction) => {
    const current = await transaction.get(completionRef)
    if (current.exists()) return

    await writeDailyGameActionIfNeeded(
      transaction,
      firestore,
      coupleId,
      uid,
      'quest_daily',
      completionRef.id,
      now,
    )

    transaction.set(completionRef, {
      uid,
      dayKey,
      completedAt: serverTimestamp(),
      completedAtClientMs: now,
    })
  })
}

function subscribeToday<T>(
  coupleId: string,
  collectionName: string,
  dayKey: string,
  onChange: (items: T[]) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  const todayQuery = query(
    collection(firestore, 'couples', coupleId, collectionName),
    where('dayKey', '==', dayKey),
  )

  return onSnapshot(
    todayQuery,
    (snapshot) => onChange(snapshot.docs.map((item) => item.data() as T)),
    () => onError?.('Не удалось синхронизировать ежедневные активности'),
  )
}

export function subscribeToDailyQuestions(
  coupleId: string,
  dayKey: string,
  onChange: (items: DailyQuestionAnswer[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeToday(coupleId, 'dailyQuestionAnswers', dayKey, onChange, onError)
}

export function subscribeToDailyChoices(
  coupleId: string,
  dayKey: string,
  onChange: (items: DailyChoiceAnswer[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeToday(coupleId, 'dailyChoiceAnswers', dayKey, onChange, onError)
}

export function subscribeToDailyQuest(
  coupleId: string,
  dayKey: string,
  onChange: (items: DailyQuestCompletion[]) => void,
  onError?: (message: string) => void,
) {
  return subscribeToday(coupleId, 'dailyQuestCompletions', dayKey, onChange, onError)
}
