export const touches = [
  { id: 'hug', label: 'Обнять', emoji: '🫂', message: 'обнимает тебя' },
  { id: 'kiss', label: 'Поцеловать', emoji: '💋', message: 'целует тебя' },
  { id: 'near', label: 'Я рядом', emoji: '🤍', message: 'напоминает: «я рядом»' },
  { id: 'hold_hand', label: 'Взять за руку', emoji: '🤝', message: 'берёт тебя за руку' },
] as const

export type TouchType = (typeof touches)[number]['id']

export function getTouchDefinition(id: string | undefined) {
  return touches.find((touch) => touch.id === id)
}
