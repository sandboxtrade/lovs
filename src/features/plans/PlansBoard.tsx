import { useState } from 'react'
import type { Couple, PlanOption, PlanScope, UserProfile } from '../../types/models'
import { addPlanOption, ratePlanOption } from './planService'
import { usePlans } from './usePlans'

type Props = { couple: Couple; profile: UserProfile }

type PlanCardProps = Props & {
  scope: PlanScope
  title: string
  subtitle: string
  icon: string
}

function Hearts({ value, interactive, onRate }: { value: number; interactive: boolean; onRate: (rating: number) => void }) {
  return (
    <div className={`heart-rating ${interactive ? 'interactive' : ''}`} aria-label={`Оценка ${value} из 5`}>
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          type="button"
          key={rating}
          disabled={!interactive}
          className={rating <= value ? 'filled' : ''}
          onClick={() => interactive && onRate(rating)}
          aria-label={`${rating} из 5`}
        >♥</button>
      ))}
    </div>
  )
}

function OptionRow({ option, scope, couple, profile }: { option: PlanOption; scope: PlanScope; couple: Couple; profile: UserProfile }) {
  const partnerId = couple.memberIds.find((id) => id !== profile.uid)
  const mine = option.createdBy === profile.uid
  const myRating = option.ratings?.[profile.uid] ?? 0
  const partnerRating = partnerId ? option.ratings?.[partnerId] ?? 0 : 0
  const [busy, setBusy] = useState(false)
  const [rateError, setRateError] = useState<string | null>(null)

  async function rate(rating: number) {
    setBusy(true)
    setRateError(null)
    try {
      await ratePlanOption(couple.id, scope, option.id, profile.uid, rating)
    } catch (cause) {
      setRateError(cause instanceof Error ? cause.message : 'Не удалось сохранить оценку')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="plan-option">
      <div className="plan-option-copy">
        <span>{mine ? 'Твой вариант' : 'Вариант партнёра'}</span>
        <strong>{option.text}</strong>
      </div>
      <div className="plan-rating-block">
        <small>{mine ? 'Оценка партнёра' : myRating ? 'Твоя оценка' : 'Насколько тебе нравится?'}</small>
        <Hearts value={mine ? partnerRating : myRating} interactive={!mine && !busy} onRate={(rating) => void rate(rating)} />
        {rateError ? <span className="plan-rate-error">{rateError}</span> : null}
      </div>
    </article>
  )
}

function PlanCard({ couple, profile, scope, title, subtitle, icon }: PlanCardProps) {
  const { options, error } = usePlans(couple.id, scope)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function add() {
    setBusy(true)
    setMessage(null)
    try {
      await addPlanOption(couple.id, scope, profile.uid, text)
      setText('')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось добавить вариант')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card plan-card">
      <div className="plan-heading">
        <span className="plan-icon" aria-hidden="true">{icon}</span>
        <div><span>{subtitle}</span><h2>{title}</h2></div>
      </div>
      <div className="plan-add">
        <input
          value={text}
          maxLength={120}
          placeholder="Добавить идею…"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && text.trim() && !busy) void add()
          }}
        />
        <button type="button" disabled={busy || !text.trim()} onClick={() => void add()}>＋</button>
      </div>
      <div className="plan-options">
        {options.length ? options.slice(0, 8).map((option) => (
          <OptionRow key={option.id} option={option} scope={scope} couple={couple} profile={profile} />
        )) : <p className="plan-empty">Пока пусто. Добавьте первый вариант — второй сможет его оценить.</p>}
      </div>
      {message ? <p className="daily-message">{message}</p> : null}
      {error ? <p className="sync-warning">{error}</p> : null}
    </section>
  )
}

export function PlansBoard(props: Props) {
  return (
    <div className="plans-board">
      <PlanCard {...props} scope="tonight" title="Сегодня вечером" subtitle="Что будем делать?" icon="☾" />
      <PlanCard {...props} scope="tomorrow" title="Завтра" subtitle="Планы на следующий день" icon="☀" />
    </div>
  )
}
