export type RoomItemId =
  | 'plant'
  | 'lamp'
  | 'rug'
  | 'photo_wall'
  | 'bookshelf'
  | 'moon_light'

export type RoomItemDefinition = {
  id: RoomItemId
  name: string
  description: string
  emoji: string
  price: number
  sceneClass: string
}

export const ROOM_ITEMS: RoomItemDefinition[] = [
  { id: 'plant', name: 'Растение', description: 'Немного жизни в комнате', emoji: '🪴', price: 18, sceneClass: 'room-item-plant' },
  { id: 'lamp', name: 'Лампа', description: 'Тёплый свет рядом с диваном', emoji: '💡', price: 22, sceneClass: 'room-item-lamp' },
  { id: 'rug', name: 'Мягкий ковёр', description: 'Комната становится уютнее', emoji: '▰', price: 28, sceneClass: 'room-item-rug' },
  { id: 'photo_wall', name: 'Наша рамка', description: 'Место для будущего воспоминания', emoji: '🖼️', price: 35, sceneClass: 'room-item-photo' },
  { id: 'bookshelf', name: 'Полка', description: 'Для ваших маленьких трофеев', emoji: '📚', price: 45, sceneClass: 'room-item-bookshelf' },
  { id: 'moon_light', name: 'Луна', description: 'Редкий вечерний декор', emoji: '🌙', price: 60, sceneClass: 'room-item-moon' },
]

export function getRoomItem(id: string) {
  return ROOM_ITEMS.find((item) => item.id === id)
}
