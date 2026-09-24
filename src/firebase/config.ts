import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

type RuntimeFirebaseConfig = Pick<
  FirebaseOptions,
  'apiKey' | 'authDomain' | 'projectId' | 'storageBucket' | 'messagingSenderId' | 'appId'
>

declare global {
  interface Window {
    __FIREBASE_CONFIG__?: RuntimeFirebaseConfig
  }
}

const env = import.meta.env
const runtime = typeof window !== 'undefined' ? window.__FIREBASE_CONFIG__ : undefined

const firebaseConfig: RuntimeFirebaseConfig = {
  apiKey: runtime?.apiKey || env.VITE_FIREBASE_API_KEY || '',
  authDomain: runtime?.authDomain || env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: runtime?.projectId || env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: runtime?.storageBucket || env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: runtime?.messagingSenderId || env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: runtime?.appId || env.VITE_FIREBASE_APP_ID || '',
}

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.storageBucket,
  firebaseConfig.messagingSenderId,
  firebaseConfig.appId,
]

export const isFirebaseConfigured = requiredConfig.every(
  (value) => typeof value === 'string' && value.trim().length > 0,
)

const app = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
