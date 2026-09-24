import { useMemo, useState } from 'react'
import type { Couple, UserProfile } from '../../types/models'
import { logout, updateDisplayName } from '../auth/authService'
import { joinCouple } from '../couple/coupleService'

type Props = {
  profile: UserProfile
  couple: Couple
  onBack: () => void
  onProfileUpdated: (profile: UserProfile) => void
}

function readableJoinError(cause: unknown) {
  const raw = cause instanceof Error ? cause.message : 'Не удалось подключиться к паре'
  if (raw.includes('permission-denied') || raw.includes('PERMISSION_DENIED')) {
    return 'Не удалось подключиться. Проверь код: пространство должно существовать и в нём должен быть только один человек.'
  }
  if (raw.includes('not-found') || raw.includes('NOT_FOUND')) {
    return 'Пространство с таким кодом не найдено.'
  }
  return raw
}

export function SettingsScreen({ profile, couple, onBack, onProfileUpdated }: Props) {
  const [name, setName] = useState(profile.displayName)
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const partnerId = couple.memberIds.find((id) => id !== profile.uid)
  const partnerName = partnerId ? couple.members[partnerId]?.displayName : null
  const subtitle = useMemo(() => partnerName ? `Пространство с ${partnerName}` : 'Ждём второго человека', [partnerName])

  async function saveName() {
    setBusy('name')
    setMessage(null)
    setError(null)
    try {
      const nextName = name.trim()
      await updateDisplayName(profile.uid, couple.id, nextName)
      onProfileUpdated({ ...profile, displayName: nextName })
      setMessage('Имя обновлено')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить имя')
    } finally {
      setBusy(null)
    }
  }

  async function copyCode() {
    setError(null)
    try {
      await navigator.clipboard.writeText(couple.id)
      setMessage('Код скопирован')
    } catch {
      setMessage('Код можно выделить и скопировать вручную')
    }
  }

  async function connectByCode() {
    const code = joinCode.trim()
    if (!code) return
    if (code === couple.id) {
      setError('Это код твоего текущего пространства. Нужен код пространства партнёра.')
      setMessage(null)
      return
    }

    setBusy('join')
    setMessage(null)
    setError(null)
    try {
      const nextCoupleId = await joinCouple(profile, code)
      onProfileUpdated({ ...profile, coupleId: nextCoupleId })
      setJoinCode('')
      setMessage('Готово. Аккаунты подключены — данные пары сейчас синхронизируются.')
    } catch (cause) {
      setError(readableJoinError(cause))
    } finally {
      setBusy(null)
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

      {!partnerId ? (
        <section className="card settings-card pair-connect-settings">
          <div className="settings-section-title">
            <span>Подключить партнёра</span>
            <small>аккаунты заново создавать не нужно</small>
          </div>
          <p className="settings-note pair-connect-copy">
            Если у вас обоих уже есть аккаунты, выберите одно общее пространство. На одном телефоне скопируйте код ниже, а на втором вставьте его сюда.
          </p>
          <label className="settings-field pair-connect-field">
            <span>Код пространства партнёра</span>
            <div className="pair-connect-row">
              <input
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.trim())}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                placeholder="Вставить код пары"
                aria-label="Код пространства партнёра"
              />
              <button
                type="button"
                disabled={busy !== null || !joinCode.trim()}
                onClick={() => void connectByCode()}
              >
                {busy === 'join' ? 'Подключаем…' : 'Подключиться'}
              </button>
            </div>
          </label>
          <div className="pair-connect-hint">
            <span>Важно</span>
            <p>Вводит код только один из вас. Второй остаётся в своём пространстве и просто отправляет его код.</p>
          </div>
        </section>
      ) : (
        <section className="card settings-card pair-connected-card">
          <div className="settings-section-title"><span>Пара подключена</span><small>синхронизация активна</small></div>
          <div className="pair-connected-person">
            <span aria-hidden="true">♥</span>
            <div><strong>{partnerName}</strong><small>вы находитесь в одном общем пространстве</small></div>
          </div>
        </section>
      )}

      <section className="card settings-card">
        <div className="settings-section-title"><span>Профиль</span><small>видно только вам двоим</small></div>
        <label className="settings-field">
          <span>Твоё имя</span>
          <div className="settings-inline"><input value={name} maxLength={30} onChange={(event) => setName(event.target.value)} /><button type="button" disabled={busy !== null || !name.trim() || name.trim() === profile.displayName} onClick={() => void saveName()}>Сохранить</button></div>
        </label>
      </section>

      <section className="card settings-card">
        <div className="settings-section-title"><span>Расписание встреч</span><small>редактируется на главном экране</small></div>
        <p className="settings-note">На главной странице каждый из вас отмечает занятые промежутки недели. Приложение само найдёт ближайшее свободное окно, когда вы оба сможете побыть вместе.</p>
      </section>

      <section className={`card settings-card invite-settings ${partnerId ? '' : 'waiting-partner'}`}>
        <div className="settings-section-title">
          <span>Код твоего пространства</span>
          <small>{partnerId ? 'оставляем для справки' : 'можно отправить партнёру вместо ввода его кода'}</small>
        </div>
        {!partnerId ? <p className="pair-settings-help">Если девушка введёт этот код у себя в настройках, её аккаунт подключится к твоему пространству.</p> : null}
        <span className="pair-settings-code-label">Код пространства</span>
        <code>{couple.id}</code>
        <button type="button" className="soft-button" onClick={() => void copyCode()}>Скопировать код</button>
      </section>

      {error ? <p className="form-error settings-feedback" role="alert">{error}</p> : null}
      {message ? <p className="settings-message settings-feedback">{message}</p> : null}

      <button className="logout-button" type="button" onClick={() => void logout()}>Выйти из аккаунта</button>
      <p className="settings-version">US · v1.1.11</p>
    </main>
  )
}
