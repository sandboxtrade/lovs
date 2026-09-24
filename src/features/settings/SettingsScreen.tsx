import { useMemo, useState } from 'react'
import type { Couple, UserProfile } from '../../types/models'
import { logout, updateDisplayName } from '../auth/authService'

type Props = {
  profile: UserProfile
  couple: Couple
  onBack: () => void
  onProfileUpdated: (profile: UserProfile) => void
}

export function SettingsScreen({ profile, couple, onBack, onProfileUpdated }: Props) {
  const [name, setName] = useState(profile.displayName)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const partnerId = couple.memberIds.find((id) => id !== profile.uid)
  const partnerName = partnerId ? couple.members[partnerId]?.displayName : null
  const subtitle = useMemo(() => partnerName ? `Пространство с ${partnerName}` : 'Ждём второго человека', [partnerName])

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
        <div className="settings-section-title"><span>Расписание встреч</span><small>теперь редактируется прямо на главном экране</small></div>
        <p className="settings-note">На главной странице каждый из вас может отметить занятые промежутки недели. Приложение само найдёт ближайшее свободное окно, когда вы оба сможете побыть вместе.</p>
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
