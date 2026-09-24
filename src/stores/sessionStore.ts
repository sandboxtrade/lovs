import { create } from 'zustand'
import type { User } from 'firebase/auth'
import type { Couple, UserProfile } from '../types/models'

type SessionState = {
  firebaseUser: User | null
  profile: UserProfile | null
  couple: Couple | null
  loading: boolean
  error: string | null
  setFirebaseUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setCouple: (couple: Couple | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  firebaseUser: null,
  profile: null,
  couple: null,
  loading: true,
  error: null,
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setProfile: (profile) => set({ profile }),
  setCouple: (couple) => set({ couple }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ firebaseUser: null, profile: null, couple: null, loading: false, error: null }),
}))
