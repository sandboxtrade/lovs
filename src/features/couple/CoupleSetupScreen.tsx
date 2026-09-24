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
  const [message, setMessage] = useState('')

  async function createSpace() {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await createCouple(profile)
      setCreatedCode(result.inviteCode)
      setMessage('Пространство создано. Отправь этот код партнёру.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось создать пространство')
    } finally {
      setBusy(false)
    }
  }

  async function openCreatedSpace() {
    if (!createdCode) return
    setBusy(true)
    setError('')
    try {
      await onDone(createdCode)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось открыть пространство')
    } finally {
      setBusy(false)
    }
  }

  async function copyCreatedCode() {
    if (!createdCode) return
    try {
      await navigator.clipboard.writeText(createdCode)
      setMessage('Код скопирован')
    } catch {
      setMessage('Выдели код и скопируй его вручную')
    }
  }

  async function joinSpace(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
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
    <main className="auth-shell pair-setup-shell">
      <section className="auth-card couple-setup">
        <div className="pair-setup-head">
          <p className="eyebrow">ПОДКЛЮЧЕНИЕ ПАРЫ</p>
          <h1>Соедините ваши аккаунты</h1>
          <p className="auth-copy">Если партнёр уже создал пространство — вставь его код ниже. Это же можно сделать позже в настройках, аккаунт пересоздавать не придётся.</p>
        </div>

        <form className="pair-join-card" onSubmit={joinSpace}>
          <div className="pair-step-badge">01</div>
          <div className="pair-step-copy">
            <strong>У меня уже есть код</strong>
            <small>Вставь код, который прислал партнёр</small>
          </div>
          <label className="pair-code-field">
            <span>Код пары</span>
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value.trim())}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="Вставить код пары"
              aria-label="Код пары"
            />
          </label>
          <button className="primary-button" disabled={busy || !joinCode.trim()}>
            {busy ? 'Подключаем…' : 'Подключиться к партнёру'}
          </button>
        </form>

        <div className="pair-divider"><span>или</span></div>

        <section className="pair-create-card">
          <div className="pair-step-row">
            <div className="pair-step-badge">02</div>
            <div className="pair-step-copy">
              <strong>Я создаю пространство первым</strong>
              <small>После создания покажем код, который нужно отправить второму человеку</small>
            </div>
          </div>

          {!createdCode ? (
            <button className="secondary-button" type="button" onClick={() => void createSpace()} disabled={busy}>
              {busy ? 'Создаём…' : 'Создать наше пространство'}
            </button>
          ) : (
            <div className="pair-created-box">
              <span>Код для партнёра</span>
              <code>{createdCode}</code>
              <p>На втором телефоне код можно вставить сразу здесь или позже в Настройки → «Подключить партнёра».</p>
              <div className="pair-created-actions">
                <button type="button" className="soft-button" onClick={() => void copyCreatedCode()}>Скопировать код</button>
                <button type="button" className="primary-button" disabled={busy} onClick={() => void openCreatedSpace()}>
                  Открыть наше пространство
                </button>
              </div>
            </div>
          )}
        </section>

        {error ? <p className="form-error pair-setup-message" role="alert">{error}</p> : null}
        {message ? <p className="settings-message pair-setup-message">{message}</p> : null}
      </section>
    </main>
  )
}
