export const emotions = [
  { id: 'miss_you', emoji: '🥹', label: 'Скучаю' },
  { id: 'love', emoji: '❤️', label: 'Хочу тебя' },
  { id: 'good', emoji: '😊', label: 'Мне хорошо' },
  { id: 'calm', emoji: '😌', label: 'Спокойно' },
  { id: 'tired', emoji: '😴', label: 'Устал(а)' },
  { id: 'sad', emoji: '😔', label: 'Грустно' },
  { id: 'stressed', emoji: '😣', label: 'Напряжённо' },
  { id: 'need_space', emoji: '🌙', label: 'Хочу тишины' },
] as const

export type EmotionId = (typeof emotions)[number]['id']

export function getEmotionDefinition(id: string | undefined) {
  return emotions.find((emotion) => emotion.id === id)
}
