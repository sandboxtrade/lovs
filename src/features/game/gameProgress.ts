import { GAME_REWARDS } from './gameService'
import type { GameAction } from '../../types/models'

export type AchievementId =
  | 'first_checkin'
  | 'first_touch'
  | 'first_goal'
  | 'first_contribution'
  | 'both_checked_in'
  | 'saving_together'
  | 'seven_shared_days'
  | 'xp_250'
  | 'first_daily'
  | 'daily_trio'

export type AchievementDefinition = {
  id: AchievementId
  emoji: string
  title: string
  description: string
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  { id: 'first_checkin', emoji: '💭', title: 'На связи', description: 'Впервые поделиться своим состоянием' },
  { id: 'first_touch', emoji: '🫂', title: 'Через расстояние', description: 'Отправить первое касание' },
  { id: 'first_goal', emoji: '🎯', title: 'Общий план', description: 'Создать первую совместную цель' },
  { id: 'first_contribution', emoji: '🪙', title: 'Первый вклад', description: 'Добавить первое пополнение в копилку' },
  { id: 'both_checked_in', emoji: '🤍', title: 'Оба здесь', description: 'Обоим отметить состояние в один день' },
  { id: 'saving_together', emoji: '🤝', title: 'Вместе копим', description: 'Обоим сделать хотя бы по одному пополнению' },
  { id: 'seven_shared_days', emoji: '🌙', title: 'Наша неделя', description: 'Быть активными в приложении в 7 разных дней' },
  { id: 'xp_250', emoji: '✨', title: 'Уже история', description: 'Набрать 250 XP пары' },
  { id: 'first_daily', emoji: '☀️', title: 'Наш день', description: 'Впервые ответить на ежедневную активность' },
  { id: 'daily_trio', emoji: '🎲', title: 'Полный комплект', description: 'Закрыть вопрос, выбор и задание в один день' },
]

export type GameProgress = {
  totalXp: number
  level: number
  currentLevelXp: number
  nextLevelXp: number
  levelProgress: number
  unlockedAchievementIds: Set<AchievementId>
  pairBonusXp: number
  activeDays: number
}

function xpNeededForNextLevel(level: number) {
  return 80 + (level - 1) * 40
}

function getLevelState(totalXp: number) {
  let level = 1
  let remaining = Math.max(0, totalXp)
  let needed = xpNeededForNextLevel(level)

  while (remaining >= needed && level < 100) {
    remaining -= needed
    level += 1
    needed = xpNeededForNextLevel(level)
  }

  return {
    level,
    currentLevelXp: remaining,
    nextLevelXp: needed,
    levelProgress: Math.min(100, Math.round((remaining / needed) * 100)),
  }
}

export function calculateGameProgress(actions: GameAction[], memberIds: string[]): GameProgress {
  const baseXp = actions.reduce((sum, action) => sum + (GAME_REWARDS[action.type] ?? 0), 0)
  const checkinsByDay = new Map<string, Set<string>>()
  const contributors = new Set<string>()
  const activeDays = new Set<string>()

  for (const action of actions) {
    activeDays.add(action.dayKey)
    if (action.type === 'emotion_daily') {
      const set = checkinsByDay.get(action.dayKey) ?? new Set<string>()
      set.add(action.uid)
      checkinsByDay.set(action.dayKey, set)
    }
    if (action.type === 'contribution_daily') contributors.add(action.uid)
  }

  const completePairCheckinDays = [...checkinsByDay.values()].filter((uids) => (
    memberIds.length >= 2 && memberIds.every((uid) => uids.has(uid))
  )).length

  const pairBonusXp = completePairCheckinDays * 15
  const totalXp = baseXp + pairBonusXp
  const unlocked = new Set<AchievementId>()

  if (actions.some((action) => action.type === 'emotion_daily')) unlocked.add('first_checkin')
  if (actions.some((action) => action.type === 'touch_daily')) unlocked.add('first_touch')
  if (actions.some((action) => action.type === 'goal_create_daily')) unlocked.add('first_goal')
  if (actions.some((action) => action.type === 'contribution_daily')) unlocked.add('first_contribution')
  if (completePairCheckinDays > 0) unlocked.add('both_checked_in')
  if (memberIds.length >= 2 && memberIds.every((uid) => contributors.has(uid))) unlocked.add('saving_together')
  if (activeDays.size >= 7) unlocked.add('seven_shared_days')
  if (totalXp >= 250) unlocked.add('xp_250')
  if (actions.some((action) => ['question_daily', 'choice_daily', 'quest_daily'].includes(action.type))) unlocked.add('first_daily')

  const dailyTypesByDay = new Map<string, Set<string>>()
  for (const action of actions) {
    if (!['question_daily', 'choice_daily', 'quest_daily'].includes(action.type)) continue
    const types = dailyTypesByDay.get(action.dayKey) ?? new Set<string>()
    types.add(action.type)
    dailyTypesByDay.set(action.dayKey, types)
  }
  if ([...dailyTypesByDay.values()].some((types) => types.size === 3)) unlocked.add('daily_trio')

  return {
    totalXp,
    ...getLevelState(totalXp),
    unlockedAchievementIds: unlocked,
    pairBonusXp,
    activeDays: activeDays.size,
  }
}
