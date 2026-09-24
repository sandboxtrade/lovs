import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config'
import { AuthScreen } from '../features/auth/AuthScreen'
import { FirebaseSetupScreen } from '../features/auth/FirebaseSetupScreen'
import { getUserProfile, prepareAuthPersistence } from '../features/auth/authService'
import { CoupleSetupScreen } from '../features/couple/CoupleSetupScreen'
import { getCouple, subscribeToCouple } from '../features/couple/coupleService'
import { HomeScreen } from '../features/home/HomeScreen'
import { useSessionStore } from '../stores/sessionStore'

export function App() {
  const {
    firebaseUser,
    profile,
    couple,
    loading,
    error,
    setFirebaseUser,
    setProfile,
    setCouple,
    setLoading,
    setError,
    reset,
  } = useSessionStore()

  async function loadSession(user: NonNullable<typeof firebaseUser>) {
    setLoading(true)
    setError(null)
    try {
      const nextProfile = await getUserProfile(user)
      setProfile(nextProfile)
      if (nextProfile.coupleId) {
        const nextCouple = await getCouple(nextProfile.coupleId)
        setCouple(nextCouple)
      } else {
        setCouple(null)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false)
      return
    }

    let cancelled = false
    let unsubscribe = () => undefined

    void prepareAuthPersistence()
      .catch(() => undefined)
      .finally(() => {
        if (cancelled) return
        unsubscribe = onAuthStateChanged(auth, (user) => {
          if (!user) {
            reset()
            return
          }
          setFirebaseUser(user)
          void loadSession(user)
        })
      })

    return () => {
      cancelled = true
      unsubscribe()
    }
    // Store actions are stable Zustand functions; subscribing once is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!profile?.coupleId) return

    return subscribeToCouple(
      profile.coupleId,
      (nextCouple) => {
        setCouple(nextCouple)
        setError(null)
      },
      setError,
    )
  }, [profile?.coupleId, setCouple, setError])

  if (!isFirebaseConfigured) return <FirebaseSetupScreen />
  if (loading) return <main className="loading-screen"><div className="heart-loader" aria-hidden="true"><span>♥</span></div><span>Открываем ваше пространство…</span></main>
  if (!firebaseUser) return <AuthScreen />
  if (error) return <main className="auth-shell"><section className="auth-card"><h1>Не удалось загрузить</h1><p className="form-error">{error}</p><button className="primary-button" onClick={() => void loadSession(firebaseUser)}>Повторить</button></section></main>
  if (!profile) return <AuthScreen />

  if (!profile.coupleId || !couple) {
    return (
      <CoupleSetupScreen
        profile={profile}
        onDone={async (coupleId) => {
          setProfile({ ...profile, coupleId })
          const nextCouple = await getCouple(coupleId)
          setCouple(nextCouple)
        }}
      />
    )
  }

  return <HomeScreen profile={profile} couple={couple} />
}
