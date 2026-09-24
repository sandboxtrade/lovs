import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { PresenceRecord, PresenceStatus } from '../../types/models'

const HEARTBEAT_MS = 45_000

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

async function writePresence(
  coupleId: string,
  uid: string,
  status: PresenceStatus,
  currentScreen: string,
) {
  const firestore = requireDb()
  await setDoc(
    doc(firestore, 'couples', coupleId, 'presence', uid),
    {
      uid,
      status,
      currentScreen,
      lastSeen: serverTimestamp(),
      lastSeenClientMs: Date.now(),
    },
    { merge: true },
  )
}

export function startPresenceHeartbeat(
  coupleId: string,
  uid: string,
  currentScreen = 'home',
): Unsubscribe {
  let stopped = false

  const publish = (status: PresenceStatus) => {
    if (stopped) return
    void writePresence(coupleId, uid, status, currentScreen).catch(() => {
      // Presence is best-effort. A temporary network loss must never break the app.
    })
  }

  const publishFromVisibility = () => {
    publish(document.visibilityState === 'visible' ? 'online' : 'away')
  }

  publishFromVisibility()

  const heartbeat = window.setInterval(publishFromVisibility, HEARTBEAT_MS)
  document.addEventListener('visibilitychange', publishFromVisibility)

  const handlePageHide = () => publish('away')
  window.addEventListener('pagehide', handlePageHide)

  return () => {
    stopped = true
    window.clearInterval(heartbeat)
    document.removeEventListener('visibilitychange', publishFromVisibility)
    window.removeEventListener('pagehide', handlePageHide)

    // Do not await during unmount. The next session/heartbeat will correct stale data.
    void writePresence(coupleId, uid, 'away', currentScreen).catch(() => undefined)
  }
}

export function subscribeToPresence(
  coupleId: string,
  onChange: (presence: Record<string, PresenceRecord>) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()

  return onSnapshot(
    collection(firestore, 'couples', coupleId, 'presence'),
    (snapshot) => {
      const next: Record<string, PresenceRecord> = {}
      snapshot.forEach((item) => {
        next[item.id] = item.data() as PresenceRecord
      })
      onChange(next)
    },
    () => onError?.('Не удалось синхронизировать статус присутствия'),
  )
}

export function getPresenceAgeMs(presence: PresenceRecord | undefined, now = Date.now()) {
  if (!presence) return Number.POSITIVE_INFINITY
  const serverMs = presence.lastSeen?.toMillis?.()
  const sourceMs = typeof serverMs === 'number' ? serverMs : presence.lastSeenClientMs
  return Math.max(0, now - sourceMs)
}
