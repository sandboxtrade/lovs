import { useState, type FormEvent } from 'react'
import { loginWithEmail, registerWithEmail } from './authService'

type Mode = 'login' | 'register'

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password.length < 6) {
      setError('Пароль должен быть не короче 6 символов')
      return
    }
    if (mode === 'register' && displayName.trim().length < 2) {
      setError('Укажите имя')
      return
    }

    setBusy(true)
    try {
      if (mode === 'register') {
        await registerWithEmail(email, password, displayName)
      } else {
        await loginWithEmail(email, password)
      }
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Не удалось войти'
      setError(message.replace('Firebase: ', ''))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card">
        <p className="eyebrow">НАШЕ ПРОСТРАНСТВО</p>
        <h1>Мы</h1>
        <p className="auth-copy">Закрытое пространство только для вас двоих.</p>

        <form onSubmit={submit} className="auth-form">
          {mode === 'register' && (
            <label>
              <span>Имя</span>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} autoComplete="name" placeholder="Как тебя называть" />
            </label>
          )}
          <label>
            <span>Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="email" placeholder="you@example.com" required />
          </label>
          <label>
            <span>Пароль</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Минимум 6 символов" required />
          </label>

          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? 'Подождите…' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}</button>
        </form>

        <button className="text-button" type="button" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
          {mode === 'login' ? 'Первый вход? Создать аккаунт' : 'Уже есть аккаунт? Войти'}
        </button>
      </section>
    </main>
  )
}
