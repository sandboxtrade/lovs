import { useState } from 'react'
import { getEmotionDefinition } from '../../data/emotions'
import type { Couple, EmotionState, UserProfile } from '../../types/models'
import { logout } from '../auth/authService'
import { DailyHub } from '../daily/DailyHub'
import { EmotionComposer } from '../emotions/EmotionComposer'
import { useEmotions } from '../emotions/useEmotions'
import { SharedGoals } from '../goals/SharedGoals'
import { GameProgressCard } from '../game/GameProgressCard'
import { presenceToView, usePresence } from '../presence/usePresence'
import { IncomingTouch } from '../touches/IncomingTouch'
import { TouchActions } from '../touches/TouchActions'
import { TouchHistory } from '../touches/TouchHistory'
import { useTouches } from '../touches/useTouches'
import { WorldScreen } from '../world/WorldScreen'

type Props = {
  profile: UserProfile
  couple: Couple
}

function getEmotionAgeMs(state: EmotionState | undefined, now = Date.now()) {
  if (!state) return Number.POSITIVE_INFINITY
  const serverMs = state.updatedAt?.toMillis?.()
  const sourceMs = typeof serverMs === 'number' ? serverMs : state.updatedAtClientMs
  return Math.max(0, now - sourceMs)
}

function formatEmotionUpdated(state: EmotionState | undefined, now: number) {
  if (!state) return 'состояние ещё не отмечено'
  const ageMs = getEmotionAgeMs(state, now)
  const minutes = Math.floor(ageMs / 60_000)
  if (minutes < 1) return 'обновлено только что'
  if (minutes < 60) return `обновлено ${minutes} мин назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `обновлено ${hours} ч назад`
  const days = Math.floor(hours / 24)
  return `обновлено ${days} дн назад`
}

export function HomeScreen({ profile, couple }: Props) {
  const [activeTab, setActiveTab] = useState<'home' | 'world'>('home')
  const partnerId = couple.memberIds.find((id) => id !== profile.uid)
  const partner = partnerId ? couple.members[partnerId] : undefined
  const { presence, now } = usePresence(couple.id, profile.uid, activeTab)
  const { states: emotions, error: emotionSyncError } = useEmotions(couple.id)
  const { events: touchEvents, unseenIncoming, error: touchSyncError } = useTouches(couple.id, profile.uid)
  const partnerPresence = presenceToView(partnerId ? presence[partnerId] : undefined, now)
  const partnerEmotion = partnerId ? emotions[partnerId] : undefined
  const selfEmotion = emotions[profile.uid]
  const partnerEmotionDefinition = getEmotionDefinition(partnerEmotion?.emotionId)

  if (activeTab === 'world') {
    return (
      <main className="app-shell">
        <WorldScreen couple={couple} profile={profile} />
        <nav className="bottom-nav bottom-nav-two" aria-label="Навигация">
          <button type="button" onClick={() => setActiveTab('home')}><span>⌂</span>Главная</button>
          <button type="button" className="active"><span>◈</span>Наш мир</button>
        </nav>
      </main>
    )
  }

  return (
    <main className="app-shell">
      <IncomingTouch coupleId={couple.id} event={unseenIncoming} sender={partner} />
      <section className="hero">
        <div>
          <p className="eyebrow">НАШЕ ПРОСТРАНСТВО</p>
          <h1>{couple.name}</h1>
        </div>
        <button className="mini-button" type="button" onClick={() => void logout()}>Выйти</button>
      </section>

      <section className="card partner-card">
        <div className="card-head">
          <div className="partner-state-copy">
            <span className="muted">{partner ? `${partner.displayName} сейчас` : 'Ждём второго человека'}</span>
            <h2>
              {partner
                ? partnerEmotionDefinition
                  ? `${partnerEmotionDefinition.emoji} ${partnerEmotionDefinition.label}`
                  : 'Пока не отметил(а) состояние'
                : 'Код подключения готов'}
            </h2>
            {partner && partnerEmotion ? (
              <span className="emotion-updated">{formatEmotionUpdated(partnerEmotion, now)}</span>
            ) : null}
          </div>
          {partner ? (
            <div className="partner-meta">
              {partnerEmotion ? <span className="intensity">{partnerEmotion.intensity}%</span> : null}
              <span className={`presence-pill ${partnerPresence.state}`}>
                <span className="presence-dot" aria-hidden="true" />
                {partnerPresence.label}
              </span>
            </div>
          ) : (
            <span className="intensity">1/2</span>
          )}
        </div>

        <p className={`quote ${partnerEmotion?.note ? '' : 'empty-note'}`}>
          {partner
            ? partnerEmotion?.note
              ? `«${partnerEmotion.note}»`
              : 'Когда здесь появится короткая мысль, она сразу синхронизируется на втором телефоне.'
            : `Код пространства: ${couple.id}`}
        </p>

        <TouchActions coupleId={couple.id} fromUid={profile.uid} toUid={partnerId} />
      </section>

      {emotionSyncError ? <p className="sync-warning">{emotionSyncError}</p> : null}
      {touchSyncError ? <p className="sync-warning">{touchSyncError}</p> : null}

      <EmotionComposer
        coupleId={couple.id}
        uid={profile.uid}
        displayName={profile.displayName}
        current={selfEmotion}
      />

      <DailyHub couple={couple} profile={profile} />

      <SharedGoals couple={couple} profile={profile} />

      <GameProgressCard coupleId={couple.id} memberIds={couple.memberIds} />

      <TouchHistory events={touchEvents} profile={profile} couple={couple} />

      <nav className="bottom-nav bottom-nav-two" aria-label="Навигация">
        <button className="active" type="button"><span>⌂</span>Главная</button>
        <button type="button" onClick={() => setActiveTab('world')}><span>◈</span>Наш мир</button>
      </nav>
    </main>
  )
}
