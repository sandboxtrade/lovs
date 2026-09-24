import { useEffect, useMemo, useState, type FormEvent } from 'react'
import type { Couple, UserProfile } from '../../types/models'
import { addContribution, createGoal } from './goalService'
import { useGoals, type GoalWithProgress } from './useGoals'

type Props = {
  couple: Couple
  profile: UserProfile
}

const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

function formatMoney(value: number) {
  return `${money.format(value)} ₽`
}

function contributionTime(clientMs: number) {
  const date = new Date(clientMs)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function GoalProgress({ goal }: { goal: GoalWithProgress }) {
  const remaining = Math.max(0, goal.target - goal.current)
  const completed = goal.current >= goal.target

  return (
    <div className="goal-progress-block">
      <div className="goal-amount-row">
        <strong>{formatMoney(goal.current)}</strong>
        <span>{goal.progress}%</span>
      </div>
      <div className="progress goal-progress"><span style={{ width: `${goal.progress}%` }} /></div>
      <small>{completed ? 'Цель собрана' : `осталось ${formatMoney(remaining)} из ${formatMoney(goal.target)}`}</small>
    </div>
  )
}

export function SharedGoals({ couple, profile }: Props) {
  const { goals, error: syncError } = useGoals(couple.id)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (!goals.length) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !goals.some((goal) => goal.id === selectedId)) {
      setSelectedId(goals[0].id)
    }
  }, [goals, selectedId])

  const selected = useMemo(
    () => goals.find((goal) => goal.id === selectedId) ?? goals[0],
    [goals, selectedId],
  )

  async function handleCreate(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await createGoal(couple.id, profile.uid, title, Number(target.replace(/\s/g, '')))
      setTitle('')
      setTarget('')
      setShowCreate(false)
      setSuccess('Новая общая цель создана')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось создать цель')
    } finally {
      setBusy(false)
    }
  }

  async function handleContribution(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    setBusy(true)
    setError(null)
    setSuccess(null)
    try {
      await addContribution(
        couple.id,
        selected.id,
        profile.uid,
        Number(amount.replace(/\s/g, '')),
        note,
      )
      setAmount('')
      setNote('')
      setSuccess('Пополнение добавлено')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось добавить пополнение')
    } finally {
      setBusy(false)
    }
  }

  function contributorName(uid: string) {
    return couple.members[uid]?.displayName ?? (uid === profile.uid ? profile.displayName : 'Мы')
  }

  return (
    <section className="card goals-card">
      <div className="section-title goals-title">
        <div>
          <span className="muted">Общая копилка</span>
          <h2>Наши цели</h2>
        </div>
        <button className="goal-create-toggle" type="button" onClick={() => setShowCreate((value) => !value)}>
          {showCreate ? 'Закрыть' : '+ Цель'}
        </button>
      </div>

      {showCreate ? (
        <form className="goal-create-form" onSubmit={handleCreate}>
          <label>
            <span>На что копим</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={80}
              placeholder="Например, поездка"
              disabled={busy}
            />
          </label>
          <label>
            <span>Нужно накопить</span>
            <div className="money-input">
              <input
                value={target}
                onChange={(event) => setTarget(event.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="120000"
                disabled={busy}
              />
              <span>₽</span>
            </div>
          </label>
          <button className="primary-button" type="submit" disabled={busy}>Создать общую цель</button>
        </form>
      ) : null}

      {goals.length > 1 ? (
        <div className="goal-tabs" aria-label="Наши цели">
          {goals.map((goal) => (
            <button
              type="button"
              className={goal.id === selected?.id ? 'active' : ''}
              onClick={() => setSelectedId(goal.id)}
              key={goal.id}
            >
              {goal.title}
            </button>
          ))}
        </div>
      ) : null}

      {!selected ? (
        <div className="goals-empty">
          <span>◎</span>
          <strong>Пока нет общей цели</strong>
          <p>Создайте первую копилку — прогресс будет одинаково виден на обоих телефонах.</p>
        </div>
      ) : (
        <>
          <div className="goal-main">
            <div>
              <span className="muted">Сейчас копим на</span>
              <h3>{selected.title}</h3>
            </div>
            {selected.current >= selected.target ? <span className="goal-complete-badge">Готово</span> : null}
          </div>

          <GoalProgress goal={selected} />

          <form className="contribution-form" onSubmit={handleContribution}>
            <div className="quick-amounts" aria-label="Быстрые суммы">
              {[100, 500, 1000, 5000].map((value) => (
                <button key={value} type="button" onClick={() => setAmount(String(value))} disabled={busy}>
                  +{money.format(value)}
                </button>
              ))}
            </div>
            <div className="money-input contribution-amount">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="Сколько отложил(а)"
                aria-label="Сумма пополнения"
                disabled={busy}
              />
              <span>₽</span>
            </div>
            <input
              className="contribution-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={100}
              placeholder="Комментарий — необязательно"
              aria-label="Комментарий к пополнению"
              disabled={busy}
            />
            <button className="primary-button" type="submit" disabled={busy || !amount}>Добавить в копилку</button>
          </form>

          <div className="contribution-history">
            <div className="contribution-history-head">
              <strong>Последние пополнения</strong>
              <span>{selected.contributions.length}</span>
            </div>
            {selected.contributions.length ? selected.contributions.slice(0, 8).map((item) => (
              <div className="contribution-row" key={item.id}>
                <div>
                  <strong>{contributorName(item.uid)}</strong>
                  <small>{item.note || contributionTime(item.createdAtClientMs)}</small>
                </div>
                <div className="contribution-value">
                  <strong>+{formatMoney(item.amount)}</strong>
                  {item.note ? <small>{contributionTime(item.createdAtClientMs)}</small> : null}
                </div>
              </div>
            )) : <p className="contribution-empty">Первое пополнение ещё впереди.</p>}
          </div>
        </>
      )}

      {syncError ? <p className="sync-warning goal-message">{syncError}</p> : null}
      {error ? <p className="form-error goal-message">{error}</p> : null}
      {success ? <p className="goal-success goal-message">{success}</p> : null}
    </section>
  )
}
