import { useState, type FormEvent } from 'react'
import { createCouple, joinCouple } from './coupleService'
import type { UserProfile } from '../../types/models'

type Props = {
  profile: UserProfile
  onDone: (coupleId: string) => Promise<void>
}

export function CoupleSetupScreen({ profile, onDone }: Props) {
  const [joinCode, setJoinCode] = useState('')
  const [createdCode, setCreatedCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function createSpace() {
    setBusy(true)
    setError('')
    try {
      const result = await createCouple(profile)
      setCreatedCode(result.inviteCode)
      await onDone(result.inviteCode)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось создать пространство')
    } finally {
      setBusy(false)
    }
  }

  async function joinSpace(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const coupleId = await joinCouple(profile, joinCode)
      await onDone(coupleId)
    } catch (cause) {
      const raw = cause instanceof Error ? cause.message : 'Не удалось присоединиться'
      setError(raw.includes('permission-denied') ? 'Неверный код или в пространстве уже два человека' : raw)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card couple-setup">
        <p className="eyebrow">ПОДКЛЮЧЕНИЕ ПАРЫ</p>
        <h1>Одно пространство на двоих</h1>
        <p className="auth-copy">Один человек создаёт пространство и передаёт второму код. Второй вводит этот код один раз.</p>

        <button className="primary-button" type="button" onClick={createSpace} disabled={busy || Boolean(createdCode)}>
          {createdCode ? 'Пространство создано' : 'Создать наше пространство'}
        </button>

        {createdCode && (
          <div className="invite-box">
            <span>Код для второго человека</span>
            <strong>{createdCode}</strong>
            <small>Передайте этот код лично. Он даёт возможность стать вторым участником.</small>
          </div>
        )}

        <div className="divider"><span>или</span></div>

        <form className="auth-form" onSubmit={joinSpace}>
          <label>
            <span>Код пространства</span>
            <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} autoCapitalize="none" autoCorrect="off" placeholder="Вставьте код" />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="secondary-button" disabled={busy || !joinCode.trim()}>Присоединиться</button>
        </form>
      </section>
    </main>
  )
}
