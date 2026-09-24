import { useMemo, useState } from 'react'
import { getEmotionDefinition } from '../../data/emotions'
import type { Couple, EmotionState, UserProfile } from '../../types/models'
import { DailyHub } from '../daily/DailyHub'
import { EmotionComposer } from '../emotions/EmotionComposer'
import { useEmotions } from '../emotions/useEmotions'
import { GameProgressCard } from '../game/GameProgressCard'
import { SharedGoals } from '../goals/SharedGoals'
import { PlansBoard } from '../plans/PlansBoard'
import { presenceToView, usePresence } from '../presence/usePresence'
import { getMeetingSummary } from '../shared/availabilityUtils'
import { CoupleOverview } from '../shared/CoupleOverview'
import { MeetingPlannerCard } from '../shared/MeetingPlannerCard'
import { PhotoOfDayCard } from '../shared/PhotoOfDayCard'
import { useSharedSpace } from '../shared/useSharedSpace'
import { SettingsScreen } from '../settings/SettingsScreen'
import { IncomingTouch } from '../touches/IncomingTouch'
import { TouchActions } from '../touches/TouchActions'
import { TouchHistory } from '../touches/TouchHistory'
import { useTouches } from '../touches/useTouches'
import { WorldScreen } from '../world/WorldScreen'
import { useSessionStore } from '../../stores/sessionStore'

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
  if (!state) return 'ещё не отмечено'
  const ageMs = getEmotionAgeMs(state, now)
  const minutes = Math.floor(ageMs / 60_000)
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч назад`
  return `${Math.floor(hours / 24)} дн назад`
}

function StateCard({
  title,
  state,
  now,
  presence,
  self,
}: {
  title: string
  state?: EmotionState
  now: number
  presence?: string
  self?: boolean
}) {
  const definition = getEmotionDefinition(state?.emotionId)
  return (
    <article className={`state-summary-card ${self ? 'self' : 'partner'}`}>
      <div className="state-summary-top">
        <span>{title}</span>
        {presence ? <small>{presence}</small> : null}
      </div>
      <div className="state-summary-main">
        <span className="state-emoji" aria-hidden="true">{definition?.emoji ?? '♡'}</span>
        <div>
          <strong>{definition?.label ?? 'Пока без состояния'}</strong>
          <small>{state ? `${state.intensity}% · ${formatEmotionUpdated(state, now)}` : 'можно отметить ниже'}</small>
        </div>
      </div>
      <p>{state?.note ? `«${state.note}»` : self ? 'Твоя короткая мысль появится здесь.' : 'Здесь появится короткая мысль партнёра.'}</p>
    </article>
  )
}

export function HomeScreen({ profile, couple }: Props) {
  const [activeTab, setActiveTab] = useState<'home' | 'world' | 'settings'>('home')
  const setProfile = useSessionStore((state) => state.setProfile)
  const partnerId = couple.memberIds.find((id) => id !== profile.uid)
  const partner = partnerId ? couple.members[partnerId] : undefined
  const { presence, now } = usePresence(couple.id, profile.uid, activeTab)
  const { states: emotions, error: emotionSyncError } = useEmotions(couple.id)
  const { events: touchEvents, unseenIncoming, error: touchSyncError } = useTouches(couple.id, profile.uid)
  const shared = useSharedSpace(couple.id)
  const partnerPresence = presenceToView(partnerId ? presence[partnerId] : undefined, now)
  const partnerEmotion = partnerId ? emotions[partnerId] : undefined
  const selfEmotion = emotions[profile.uid]

  const meetingSummary = useMemo(
    () => getMeetingSummary(shared.availability[profile.uid], partnerId ? shared.availability[partnerId] : undefined, Boolean(partnerId), partner?.displayName, now),
    [shared.availability, profile.uid, partnerId, partner?.displayName, now],
  )

  if (activeTab === 'settings') {
    return (
      <SettingsScreen
        profile={profile}
        couple={couple}
        onBack={() => setActiveTab('home')}
        onProfileUpdated={setProfile}
      />
    )
  }

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
    <main className="app-shell polished-home">
      <IncomingTouch coupleId={couple.id} event={unseenIncoming} sender={partner} />

      <CoupleOverview
        profile={profile}
        couple={couple}
        partner={partner}
        partnerId={partnerId}
        partnerPresenceLabel={partnerPresence.label}
        partnerOnline={partnerPresence.state === 'online'}
        photos={shared.photos}
        meetingSummary={meetingSummary.summary}
        meetingDetail={meetingSummary.detail}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {shared.error ? <p className="sync-warning">{shared.error}</p> : null}
      {emotionSyncError ? <p className="sync-warning">{emotionSyncError}</p> : null}
      {touchSyncError ? <p className="sync-warning">{touchSyncError}</p> : null}

      <MeetingPlannerCard
        couple={couple}
        profile={profile}
        partnerName={partner?.displayName}
        availability={shared.availability}
      />

      <PhotoOfDayCard couple={couple} profile={profile} partner={partner} photos={shared.photoOfDay} />

      <section className="home-section states-section">
        <div className="home-section-heading">
          <span>Как мы сейчас</span>
          <small>обновляется у вас обоих сразу</small>
        </div>
        <div className="state-pair-grid">
          <StateCard
            title={partner ? partner.displayName : 'Партнёр'}
            state={partnerEmotion}
            now={now}
            presence={partner ? partnerPresence.label : 'ещё не подключён'}
          />
          <StateCard title={`${profile.displayName} · ты`} state={selfEmotion} now={now} self />
        </div>
        <div className="quick-touch-card">
          <div><strong>Быстрый знак внимания</strong><span>без переписки</span></div>
          <TouchActions coupleId={couple.id} fromUid={profile.uid} toUid={partnerId} />
        </div>
      </section>

      <EmotionComposer
        coupleId={couple.id}
        uid={profile.uid}
        displayName={profile.displayName}
        current={selfEmotion}
      />

      <PlansBoard couple={couple} profile={profile} />

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
