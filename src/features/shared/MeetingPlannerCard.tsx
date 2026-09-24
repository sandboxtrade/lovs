import { useEffect, useMemo, useState } from 'react'
import type { BusyWindow, Couple, UserProfile, WeekdayKey, WeeklyAvailability } from '../../types/models'
import { WEEKDAY_KEYS, createEmptyAvailabilityDays, saveAvailability } from './sharedService'
import { DAY_LABELS, FULL_DAY_LABELS, findNextMutualWindow, getMeetingSummary, hasScheduleEntries } from './availabilityUtils'

type Props = {
  couple: Couple
  profile: UserProfile
  partnerName?: string
  availability: Record<string, WeeklyAvailability>
}

function minutesToInput(minutes: number) {
  const safeMinutes = Math.max(0, Math.min(24 * 60, minutes))
  const hours = Math.floor(safeMinutes / 60)
  const mins = safeMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function inputToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map((item) => Number(item))
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0
  return Math.max(0, Math.min(24 * 60, hours * 60 + minutes))
}

function createEmptyAvailability(uid: string): WeeklyAvailability {
  return {
    uid,
    configured: false,
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    days: createEmptyAvailabilityDays(),
    updatedAtClientMs: 0,
    updatedAt: null,
  }
}

export function MeetingPlannerCard({ couple, profile, partnerName, availability }: Props) {
  const partnerId = couple.memberIds.find((id) => id !== profile.uid)
  const ownSchedule = availability[profile.uid] ?? createEmptyAvailability(profile.uid)
  const partnerSchedule = partnerId ? availability[partnerId] : undefined
  const [localDays, setLocalDays] = useState<Record<WeekdayKey, BusyWindow[]>>(ownSchedule.days)
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setLocalDays(ownSchedule.days)
  }, [ownSchedule.updatedAtClientMs, profile.uid])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const nextWindow = useMemo(
    () => (partnerSchedule ? findNextMutualWindow([ownSchedule, partnerSchedule], now) : null),
    [ownSchedule, partnerSchedule, now],
  )

  const ownReady = hasScheduleEntries(ownSchedule)
  const partnerReady = hasScheduleEntries(partnerSchedule)
  const summary = getMeetingSummary(ownSchedule, partnerSchedule, Boolean(partnerId), partnerName, now)

  function updateWindow(dayKey: WeekdayKey, id: string, field: 'startMinutes' | 'endMinutes', value: number) {
    setLocalDays((current) => ({
      ...current,
      [dayKey]: current[dayKey].map((window) => window.id === id ? { ...window, [field]: value } : window),
    }))
  }

  function removeWindow(dayKey: WeekdayKey, id: string) {
    setLocalDays((current) => ({
      ...current,
      [dayKey]: current[dayKey].filter((window) => window.id !== id),
    }))
  }

  function addWindow(dayKey: WeekdayKey) {
    setLocalDays((current) => ({
      ...current,
      [dayKey]: [
        ...current[dayKey],
        {
          id: `${dayKey}-${Date.now()}-${current[dayKey].length}`,
          startMinutes: 9 * 60,
          endMinutes: 18 * 60,
        },
      ],
    }))
  }

  async function handleSave() {
    setBusy(true)
    setMessage(null)
    try {
      const normalizedDays = WEEKDAY_KEYS.reduce<Record<WeekdayKey, BusyWindow[]>>((accumulator, dayKey) => {
        accumulator[dayKey] = localDays[dayKey]
          .map((window) => ({
            ...window,
            startMinutes: Math.max(0, Math.min(24 * 60 - 15, window.startMinutes)),
            endMinutes: Math.max(15, Math.min(24 * 60, window.endMinutes)),
          }))
          .filter((window) => window.endMinutes - window.startMinutes >= 15)
          .sort((left, right) => left.startMinutes - right.startMinutes)
        return accumulator
      }, {} as Record<WeekdayKey, BusyWindow[]>)

      await saveAvailability(couple.id, profile.uid, normalizedDays)
      setMessage('Расписание сохранено')
      setExpanded(false)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось сохранить расписание')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="card planner-card">
      <div className="planner-summary">
        <div>
          <span className="muted planner-kicker">Время до встречи</span>
          <h2>{summary.summary}</h2>
          <p>{summary.detail}</p>
        </div>
        <div className="planner-badge">{nextWindow ? 'общее окно' : 'расписание'}</div>
      </div>

      <div className="planner-status-grid">
        <div className={`planner-status-tile ${ownReady ? 'ready' : ''}`}>
          <strong>Ты</strong>
          <small>{ownReady ? 'Неделя заполнена' : 'Нужно добавить интервалы занятости'}</small>
        </div>
        <div className={`planner-status-tile ${partnerReady ? 'ready' : ''}`}>
          <strong>{partnerName ?? 'Партнёр'}</strong>
          <small>{partnerReady ? 'Неделя заполнена' : 'Пока без расписания'}</small>
        </div>
      </div>

      <button type="button" className="planner-toggle" onClick={() => setExpanded((value) => !value)}>
        {expanded ? 'Скрыть моё расписание' : 'Изменить моё расписание'}
      </button>

      {expanded ? (
        <div className="planner-editor">
          <p className="planner-help">Отмечай только занятые промежутки. Всё остальное приложение считает свободным временем для встречи.</p>

          {WEEKDAY_KEYS.map((dayKey) => (
            <section className="planner-day" key={dayKey}>
              <div className="planner-day-head">
                <strong>{FULL_DAY_LABELS[dayKey]}</strong>
                <button type="button" className="mini-button planner-add-mini" onClick={() => addWindow(dayKey)}>+ добавить</button>
              </div>

              {localDays[dayKey].length ? (
                <div className="planner-window-list">
                  {localDays[dayKey].map((window) => (
                    <div className="planner-window" key={window.id}>
                      <label>
                        <span>{DAY_LABELS[dayKey]}</span>
                        <input
                          type="time"
                          value={minutesToInput(window.startMinutes)}
                          onChange={(event) => updateWindow(dayKey, window.id, 'startMinutes', inputToMinutes(event.target.value))}
                        />
                      </label>
                      <label>
                        <span>до</span>
                        <input
                          type="time"
                          value={minutesToInput(window.endMinutes)}
                          onChange={(event) => updateWindow(dayKey, window.id, 'endMinutes', inputToMinutes(event.target.value))}
                        />
                      </label>
                      <button type="button" className="planner-remove" onClick={() => removeWindow(dayKey, window.id)} aria-label={`Удалить интервал ${FULL_DAY_LABELS[dayKey]}`}>×</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="planner-empty-day">В этот день пока нет занятых интервалов.</div>
              )}
            </section>
          ))}

          <button type="button" className="primary-button planner-save" disabled={busy} onClick={() => void handleSave()}>
            {busy ? 'Сохраняем…' : 'Сохранить расписание'}
          </button>
        </div>
      ) : null}

      {message ? <p className="planner-message">{message}</p> : null}
    </section>
  )
}
