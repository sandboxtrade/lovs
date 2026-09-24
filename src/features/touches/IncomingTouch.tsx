import { useEffect, useState } from 'react'
import { getTouchDefinition } from '../../data/touches'
import type { CoupleMember, TouchEvent } from '../../types/models'
import { markTouchSeen } from './touchService'

type Props = {
  coupleId: string
  event?: TouchEvent
  sender?: CoupleMember
}

export function IncomingTouch({ coupleId, event, sender }: Props) {
  const [visibleId, setVisibleId] = useState<string | null>(null)
  const [closing, setClosing] = useState(false)

  useEffect(() => {
    if (!event) {
      setVisibleId(null)
      return
    }
    setClosing(false)
    setVisibleId(event.id)
  }, [event?.id])

  if (!event || visibleId !== event.id) return null

  const currentEvent = event
  const definition = getTouchDefinition(currentEvent.type)
  if (!definition) return null

  async function dismiss() {
    if (closing) return
    setClosing(true)
    try {
      await markTouchSeen(coupleId, currentEvent.id)
    } finally {
      setVisibleId(null)
      setClosing(false)
    }
  }

  return (
    <section className="incoming-touch" role="status" aria-live="polite">
      <div className="incoming-touch-icon" aria-hidden="true">{definition.emoji}</div>
      <div className="incoming-touch-copy">
        <strong>{sender?.displayName ?? 'Твой человек'} {definition.message}</strong>
        <span>Это пришло тебе только что</span>
      </div>
      <button type="button" onClick={() => void dismiss()} disabled={closing} aria-label="Закрыть">
        {closing ? '…' : '×'}
      </button>
    </section>
  )
}
