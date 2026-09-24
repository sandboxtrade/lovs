import { useEffect, useMemo, useState } from 'react'
import type { PresenceRecord } from '../../types/models'
import { getPresenceAgeMs, startPresenceHeartbeat, subscribeToPresence } from './presenceService'

export type PresenceView = {
  state: 'online' | 'away' | 'offline' | 'unknown'
  label: string
  isOnline: boolean
}

function formatLastSeen(ageMs: number) {
  if (!Number.isFinite(ageMs)) return 'ещё не появлялся'

  const seconds = Math.floor(ageMs / 1000)
  if (seconds < 90) return 'только что'

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} мин назад`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч назад`

  const days = Math.floor(hours / 24)
  return `${days} дн назад`
}

export function presenceToView(presence: PresenceRecord | undefined, now = Date.now()): PresenceView {
  if (!presence) {
    return { state: 'unknown', label: 'ещё не появлялся', isOnline: false }
  }

  const ageMs = getPresenceAgeMs(presence, now)

  if (presence.status === 'online' && ageMs <= 90_000) {
    return { state: 'online', label: 'сейчас в приложении', isOnline: true }
  }

  if (ageMs <= 90_000) {
    return { state: 'away', label: 'недавно был в приложении', isOnline: false }
  }

  return {
    state: 'offline',
    label: `был(а) ${formatLastSeen(ageMs)}`,
    isOnline: false,
  }
}

export function usePresence(coupleId: string, uid: string, currentScreen = 'home') {
  const [presence, setPresence] = useState<Record<string, PresenceRecord>>({})
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const stopHeartbeat = startPresenceHeartbeat(coupleId, uid, currentScreen)
    const stopSubscription = subscribeToPresence(coupleId, setPresence)
    const clock = window.setInterval(() => setNow(Date.now()), 15_000)

    return () => {
      stopHeartbeat()
      stopSubscription()
      window.clearInterval(clock)
    }
  }, [coupleId, uid, currentScreen])

  return useMemo(() => ({ presence, now }), [presence, now])
}
