import { getTouchDefinition } from '../../data/touches'
import type { Couple, TouchEvent, UserProfile } from '../../types/models'

type Props = {
  events: TouchEvent[]
  profile: UserProfile
  couple: Couple
}

function formatTouchTime(event: TouchEvent) {
  const serverMs = event.createdAt?.toMillis?.()
  const timestamp = typeof serverMs === 'number' ? serverMs : event.createdAtClientMs
  const ageMinutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60_000))
  if (ageMinutes < 1) return 'только что'
  if (ageMinutes < 60) return `${ageMinutes} мин назад`
  const hours = Math.floor(ageMinutes / 60)
  if (hours < 24) return `${hours} ч назад`
  const days = Math.floor(hours / 24)
  return `${days} дн назад`
}

export function TouchHistory({ events, profile, couple }: Props) {
  if (events.length === 0) return null

  return (
    <section className="card touch-history-card">
      <div className="section-title">
        <div>
          <span className="muted">Между вами</span>
          <h3>Последние касания</h3>
        </div>
      </div>
      <div className="touch-history-list">
        {events.slice(0, 5).map((event) => {
          const definition = getTouchDefinition(event.type)
          if (!definition) return null
          const sentByMe = event.fromUid === profile.uid
          const otherUid = sentByMe ? event.toUid : event.fromUid
          const otherName = couple.members[otherUid]?.displayName ?? 'Твой человек'
          return (
            <div className="touch-history-row" key={event.id}>
              <span className="touch-history-emoji" aria-hidden="true">{definition.emoji}</span>
              <div>
                <strong>{sentByMe ? `Ты → ${otherName}` : `${otherName} → тебе`}</strong>
                <small>{definition.label} · {formatTouchTime(event)}</small>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
