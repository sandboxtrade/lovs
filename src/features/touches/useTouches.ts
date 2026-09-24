import { useEffect, useMemo, useState } from 'react'
import type { TouchEvent } from '../../types/models'
import { subscribeToTouches } from './touchService'

export function useTouches(coupleId: string, uid: string) {
  const [events, setEvents] = useState<TouchEvent[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setError(null)
    return subscribeToTouches(coupleId, setEvents, setError)
  }, [coupleId])

  const incoming = useMemo(
    () => events.filter((event) => event.toUid === uid),
    [events, uid],
  )

  const outgoing = useMemo(
    () => events.filter((event) => event.fromUid === uid),
    [events, uid],
  )

  const unseenIncoming = incoming.find((event) => !event.seenAtClientMs)

  return { events, incoming, outgoing, unseenIncoming, error }
}
