import { useEffect, useMemo, useState } from 'react'
import { getDailyContent } from '../../data/dailyContent'
import type {
  DailyChoiceAnswer,
  DailyQuestionAnswer,
  DailyQuestCompletion,
} from '../../types/models'
import { getDayKey } from '../game/gameService'
import {
  subscribeToDailyChoices,
  subscribeToDailyQuest,
  subscribeToDailyQuestions,
} from './dailyService'

export function useDaily(coupleId: string) {
  const [now, setNow] = useState(() => Date.now())
  const dayKey = getDayKey(now)
  const content = useMemo(() => getDailyContent(dayKey), [dayKey])
  const [questions, setQuestions] = useState<DailyQuestionAnswer[]>([])
  const [choices, setChoices] = useState<DailyChoiceAnswer[]>([])
  const [quest, setQuest] = useState<DailyQuestCompletion[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    setError(null)
    const stopQuestions = subscribeToDailyQuestions(coupleId, dayKey, setQuestions, setError)
    const stopChoices = subscribeToDailyChoices(coupleId, dayKey, setChoices, setError)
    const stopQuest = subscribeToDailyQuest(coupleId, dayKey, setQuest, setError)
    return () => {
      stopQuestions()
      stopChoices()
      stopQuest()
    }
  }, [coupleId, dayKey])

  return { dayKey, content, questions, choices, quest, error }
}
