import { useEffect, useMemo, useState } from 'react'
import type { Goal, GoalContribution } from '../../types/models'
import { subscribeToGoalContributions, subscribeToGoals } from './goalService'

export type GoalWithProgress = Goal & {
  contributions: GoalContribution[]
  current: number
  progress: number
}

export function useGoals(coupleId: string) {
  const [goals, setGoals] = useState<Goal[]>([])
  const [contributionsByGoal, setContributionsByGoal] = useState<Record<string, GoalContribution[]>>({})
  const [goalsError, setGoalsError] = useState<string | null>(null)
  const [contributionsError, setContributionsError] = useState<string | null>(null)

  useEffect(() => {
    setGoalsError(null)
    return subscribeToGoals(
      coupleId,
      (next) => {
        setGoals(next)
        setGoalsError(null)
      },
      setGoalsError,
    )
  }, [coupleId])

  useEffect(() => {
    const activeIds = new Set(goals.map((goal) => goal.id))
    setContributionsByGoal((current) => {
      const next: Record<string, GoalContribution[]> = {}
      Object.keys(current).forEach((goalId) => {
        const items = current[goalId]
        if (items && activeIds.has(goalId)) next[goalId] = items
      })
      return next
    })

    setContributionsError(null)
    const unsubscribers = goals.map((goal) =>
      subscribeToGoalContributions(
        coupleId,
        goal.id,
        (items) => {
          setContributionsByGoal((current) => ({ ...current, [goal.id]: items }))
          setContributionsError(null)
        },
        setContributionsError,
      ),
    )

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe())
  }, [coupleId, goals])

  const goalsWithProgress = useMemo<GoalWithProgress[]>(
    () => goals.map((goal) => {
      const contributions = contributionsByGoal[goal.id] ?? []
      const current = contributions.reduce((sum, item) => sum + item.amount, 0)
      return {
        ...goal,
        contributions,
        current,
        progress: goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0,
      }
    }),
    [goals, contributionsByGoal],
  )

  return { goals: goalsWithProgress, error: goalsError ?? contributionsError }
}
