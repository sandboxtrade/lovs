import type { Timestamp } from 'firebase/firestore'

export type UserProfile = {
  uid: string
  email: string
  displayName: string
  coupleId: string | null
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type CoupleMember = {
  uid: string
  displayName: string
}

export type Couple = {
  id: string
  name: string
  createdBy: string
  memberIds: string[]
  members: Record<string, CoupleMember>
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type MeetingState = {
  meetingAtClientMs: number
  updatedBy: string
  updatedAt?: Timestamp | null
  updatedAtClientMs: number
}

export type PartnerPhoto = {
  targetUid: string
  uploadedBy: string
  photoDataUrl: string
  updatedAt?: Timestamp | null
  updatedAtClientMs: number
}

export type WeekdayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

export type BusyWindow = {
  id: string
  startMinutes: number
  endMinutes: number
}

export type WeeklyAvailability = {
  uid: string
  configured: boolean
  timezoneOffsetMinutes: number
  days: Record<WeekdayKey, BusyWindow[]>
  updatedAt?: Timestamp | null
  updatedAtClientMs: number
}

export type PhotoOfDay = {
  uid: string
  photoDataUrl: string
  caption: string
  dayKey: string
  updatedAt?: Timestamp | null
  updatedAtClientMs: number
}

export type PlanScope = 'tonight' | 'tomorrow'

export type PlanOption = {
  id: string
  text: string
  createdBy: string
  ratings: Record<string, number>
  createdAt?: Timestamp | null
  createdAtClientMs: number
}

export type PresenceStatus = 'online' | 'away'

export type PresenceRecord = {
  uid: string
  status: PresenceStatus
  currentScreen: string
  lastSeen?: Timestamp | null
  lastSeenClientMs: number
}

export type EmotionState = {
  uid: string
  emotionId: string
  intensity: number
  note: string
  updatedAt?: Timestamp | null
  updatedAtClientMs: number
}

export type TouchEvent = {
  id: string
  fromUid: string
  toUid: string
  type: string
  createdAt?: Timestamp | null
  createdAtClientMs: number
  seenAt?: Timestamp | null
  seenAtClientMs?: number | null
}

export type Goal = {
  id: string
  title: string
  target: number
  currency: 'RUB'
  createdBy: string
  createdAt?: Timestamp | null
  createdAtClientMs: number
}

export type GoalContribution = {
  id: string
  uid: string
  amount: number
  note: string
  createdAt?: Timestamp | null
  createdAtClientMs: number
}

export type GameActionType =
  | 'emotion_daily'
  | 'touch_daily'
  | 'goal_create_daily'
  | 'contribution_daily'
  | 'question_daily'
  | 'choice_daily'
  | 'quest_daily'

export type GameAction = {
  id: string
  uid: string
  type: GameActionType
  dayKey: string
  sourceId: string
  createdAt?: Timestamp | null
  createdAtClientMs: number
}

export type EconomyState = {
  spentCoins: number
  updatedAt?: Timestamp | null
  updatedAtClientMs: number
}

export type RoomPurchase = {
  id: string
  itemId: string
  cost: number
  purchasedBy: string
  purchasedAt?: Timestamp | null
  purchasedAtClientMs: number
}

export type PetInteractionType = 'pet' | 'play' | 'rest'

export type PetState = {
  name: string
  lastInteractionType: PetInteractionType | 'none'
  lastInteractedBy: string
  lastInteractionAt?: Timestamp | null
  lastInteractionAtClientMs: number
  updatedAt?: Timestamp | null
  updatedAtClientMs: number
}

export type DailyQuestionAnswer = {
  uid: string
  dayKey: string
  answer: string
  createdAt?: Timestamp | null
  createdAtClientMs: number
}

export type DailyChoiceAnswer = {
  uid: string
  dayKey: string
  ownChoice: 'a' | 'b'
  partnerGuess: 'a' | 'b'
  createdAt?: Timestamp | null
  createdAtClientMs: number
}

export type DailyQuestCompletion = {
  uid: string
  dayKey: string
  completedAt?: Timestamp | null
  completedAtClientMs: number
}
