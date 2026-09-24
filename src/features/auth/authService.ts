import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../../firebase/config'
import type { UserProfile } from '../../types/models'

function requireFirebase() {
  if (!auth || !db) throw new Error('Firebase is not configured')
  return { auth, db }
}

export async function prepareAuthPersistence() {
  const { auth } = requireFirebase()
  await setPersistence(auth, browserLocalPersistence)
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  const firebase = requireFirebase()
  await setPersistence(firebase.auth, browserLocalPersistence)
  const credential = await createUserWithEmailAndPassword(firebase.auth, email.trim(), password)
  await updateProfile(credential.user, { displayName: displayName.trim() })

  await setDoc(doc(firebase.db, 'users', credential.user.uid), {
    uid: credential.user.uid,
    email: credential.user.email ?? email.trim(),
    displayName: displayName.trim(),
    coupleId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return credential.user
}

export async function loginWithEmail(email: string, password: string) {
  const firebase = requireFirebase()
  await setPersistence(firebase.auth, browserLocalPersistence)
  const credential = await signInWithEmailAndPassword(firebase.auth, email.trim(), password)
  return credential.user
}

export async function logout() {
  const { auth } = requireFirebase()
  await signOut(auth)
}

export async function getUserProfile(user: User): Promise<UserProfile> {
  const { db } = requireFirebase()
  const ref = doc(db, 'users', user.uid)
  const snapshot = await getDoc(ref)

  if (snapshot.exists()) return snapshot.data() as UserProfile

  const fallback: UserProfile = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? 'Без имени',
    coupleId: null,
  }

  await setDoc(ref, {
    ...fallback,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return fallback
}
