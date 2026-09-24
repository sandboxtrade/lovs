import type { GameAction, PetInteractionType, PetState } from '../../types/models'
import type { GameProgress } from '../game/gameProgress'

export type PetStage = {
  id: 'kitten' | 'curious' | 'companion' | 'guardian'
  label: string
  minLevel: number
  emoji: string
}

export type PetMood = {
  id: 'loved' | 'excited' | 'calm' | 'sleepy' | 'waiting'
  label: string
  emoji: string
}

export type PetView = {
  name: string
  stage: PetStage
  mood: PetMood
  petLevel: number
  levelProgress: number
  nextLevelXp: number
  currentLevelXp: number
  reaction: string
}

const PET_STAGES: PetStage[] = [
  { id: 'kitten', label: 'Малыш', minLevel: 1, emoji: '🐱' },
  { id: 'curious', label: 'Любопытный', minLevel: 3, emoji: '🐱' },
  { id: 'companion', label: 'Друг', minLevel: 5, emoji: '🐈' },
  { id: 'guardian', label: 'Хранитель', minLevel: 8, emoji: '🐈‍⬛' },
]

function getPetLevel(totalXp: number) {
  return Math.min(10, Math.floor(Math.max(0, totalXp) / 80) + 1)
}

function getStage(petLevel: number) {
  return [...PET_STAGES].reverse().find((stage) => petLevel >= stage.minLevel) ?? PET_STAGES[0]
}

function getLatestAction(actions: GameAction[]) {
  return [...actions].sort((a, b) => b.createdAtClientMs - a.createdAtClientMs)[0]
}

function didBothCheckInToday(actions: GameAction[], memberIds: string[], now: number) {
  if (memberIds.length < 2) return false
  const dayKey = new Date(now).toISOString().slice(0, 10)
  const checked = new Set(
    actions
      .filter((action) => action.type === 'emotion_daily' && action.dayKey === dayKey)
      .map((action) => action.uid),
  )
  return memberIds.every((uid) => checked.has(uid))
}

function getMood(
  state: PetState | null,
  actions: GameAction[],
  memberIds: string[],
  now: number,
): PetMood {
  const lastPetAge = state?.lastInteractionAtClientMs
    ? Math.max(0, now - state.lastInteractionAtClientMs)
    : Number.POSITIVE_INFINITY

  if (state?.lastInteractionType === 'rest' && lastPetAge < 45 * 60_000) {
    return { id: 'sleepy', label: 'сонный', emoji: '💤' }
  }

  if (didBothCheckInToday(actions, memberIds, now)) {
    return { id: 'loved', label: 'чувствует вашу близость', emoji: '🤍' }
  }

  const latest = getLatestAction(actions)
  const latestAge = latest ? Math.max(0, now - latest.createdAtClientMs) : Number.POSITIVE_INFINITY
  if (latestAge < 20 * 60_000) return { id: 'excited', label: 'оживлённый', emoji: '✨' }
  if (latestAge < 12 * 60 * 60_000) return { id: 'calm', label: 'спокойный', emoji: '🌙' }

  const hour = new Date(now).getHours()
  if (hour >= 22 || hour < 7) return { id: 'sleepy', label: 'дремлет', emoji: '💤' }
  return { id: 'waiting', label: 'ждёт вас', emoji: '🐾' }
}

const PET_INTERACTION_REACTIONS: Record<PetInteractionType, string> = {
  pet: 'Прижался поближе и довольно замурчал.',
  play: 'Сразу оживился — кажется, играть он готов всегда.',
  rest: 'Устроился поудобнее и постепенно засыпает.',
}

function getReaction(state: PetState | null, actions: GameAction[]) {
  const latest = getLatestAction(actions)
  const petIsLatest = Boolean(
    state?.lastInteractionAtClientMs
      && (!latest || state.lastInteractionAtClientMs >= latest.createdAtClientMs),
  )

  if (state && petIsLatest && state.lastInteractionType !== 'none') {
    return PET_INTERACTION_REACTIONS[state.lastInteractionType]
  }

  switch (latest?.type) {
    case 'emotion_daily': return 'Заметил, что кто-то из вас поделился состоянием.'
    case 'touch_daily': return 'Кажется, здесь только что стало немного теплее.'
    case 'goal_create_daily': return 'Новая общая цель? Он уже заинтересован.'
    case 'contribution_daily': return 'Ещё один шаг к вашей общей цели.'
    default: return 'Он осматривается в вашей комнате и ждёт первого совместного события.'
  }
}

export function calculatePetView(
  state: PetState | null,
  actions: GameAction[],
  progress: GameProgress,
  memberIds: string[],
  now = Date.now(),
): PetView {
  const petLevel = getPetLevel(progress.totalXp)
  const xpPerPetLevel = 80
  const currentLevelXp = progress.totalXp % xpPerPetLevel
  const isMax = petLevel >= 10

  return {
    name: state?.name?.trim() || 'Моти',
    stage: getStage(petLevel),
    mood: getMood(state, actions, memberIds, now),
    petLevel,
    currentLevelXp: isMax ? xpPerPetLevel : currentLevelXp,
    nextLevelXp: xpPerPetLevel,
    levelProgress: isMax ? 100 : Math.round((currentLevelXp / xpPerPetLevel) * 100),
    reaction: getReaction(state, actions),
  }
}
