import { useEffect, useMemo, useState } from 'react'
import type { Couple, MeetingState, UserProfile } from '../../types/models'
import { logout, updateDisplayName } from '../auth/authService'
import { saveMeeting } from '../shared/sharedService'

type Props = {
  profile: UserProfile
  couple: Couple
  meeting: MeetingState | null
  onBack: () => void
  onProfileUpdated: (profile: UserProfile) => void
}

function toInputValue(timestamp?: number) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(timestamp - offset).toISOString().slice(0, 16)
}

export function SettingsScreen({ profile, couple, meeting, onBack, onProfileUpdated }: Props) {
  const [name, setName] = useState(profile.displayName)
  const [meetingValue, setMeetingValue] = useState(() => toInputValue(meeting?.meetingAtClientMs))
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const partnerId = couple.memberIds.find((id) => id !== profile.uid)
  const partnerName = partnerId ? couple.members[partnerId]?.displayName : null
  const subtitle = useMemo(() => partnerName ? `Пространство с ${partnerName}` : 'Ждём второго человека', [partnerName])

  useEffect(() => {
    setMeetingValue(toInputValue(meeting?.meetingAtClientMs))
  }, [meeting?.meetingAtClientMs])

  async function saveName() {
    setBusy('name')
    setMessage(null)
    try {
      const nextName = name.trim()
      await updateDisplayName(profile.uid, couple.id, nextName)
      onProfileUpdated({ ...profile, displayName: nextName })
      setMessage('Имя обновлено')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось сохранить имя')
    } finally {
      setBusy(null)
    }
  }

  async function saveMeetingTime() {
    if (!meetingValue) return
    setBusy('meeting')
    setMessage(null)
    try {
      const timestamp = new Date(meetingValue).getTime()
      if (!Number.isFinite(timestamp)) throw new Error('Выбери дату и время')
      await saveMeeting(couple.id, profile.uid, timestamp)
      setMessage('Время встречи сохранено')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось сохранить встречу')
    } finally {
      setBusy(null)
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(couple.id)
      setMessage('Код скопирован')
    } catch {
      setMessage('Код можно выделить и скопировать вручную')
    }
  }

  return (
    <main className="app-shell settings-shell">
      <header className="settings-header">
        <button type="button" className="back-button" onClick={onBack}>‹</button>
        <div><span>Настройки</span><h1>Ваше пространство</h1></div>
      </header>

      <section className="settings-profile-card">
        <div className="settings-avatar">{profile.displayName.slice(0, 1).toUpperCase()}</div>
        <div><strong>{profile.displayName}</strong><span>{subtitle}</span></div>
      </section>

      <section className="card settings-card">
        <div className="settings-section-title"><span>Профиль</span><small>видно только вам двоим</small></div>
        <label className="settings-field">
          <span>Твоё имя</span>
          <div className="settings-inline"><input value={name} maxLength={30} onChange={(event) => setName(event.target.value)} /><button type="button" disabled={busy !== null || !name.trim() || name.trim() === profile.displayName} onClick={() => void saveName()}>Сохранить</button></div>
        </label>
      </section>

      <section className="card settings-card">
        <div className="settings-section-title"><span>Следующая встреча</span><small>счётчик появится наверху</small></div>
        <label className="settings-field">
          <span>Дата и время</span>
          <div className="settings-inline"><input type="datetime-local" value={meetingValue} onChange={(event) => setMeetingValue(event.target.value)} /><button type="button" disabled={busy !== null || !meetingValue} onClick={() => void saveMeetingTime()}>Готово</button></div>
        </label>
      </section>

      <section className="card settings-card invite-settings">
        <div className="settings-section-title"><span>Код пространства</span><small>нужен только для подключения второго аккаунта</small></div>
        <code>{couple.id}</code>
        <button type="button" className="soft-button" onClick={() => void copyCode()}>Скопировать код</button>
      </section>

      {message ? <p className="settings-message">{message}</p> : null}

      <button className="logout-button" type="button" onClick={() => void logout()}>Выйти из аккаунта</button>
      <p className="settings-version">US · v1.1.3</p>
    </main>
  )
}
