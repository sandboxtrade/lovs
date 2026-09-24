import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type {
  BusyWindow,
  MeetingState,
  PartnerPhoto,
  PhotoOfDay,
  WeekdayKey,
  WeeklyAvailability,
} from '../../types/models'

const MAX_PHOTO_DATA_URL_BYTES = 700_000
const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024
export const WEEKDAY_KEYS: WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
}

function encodedBytes(value: string) {
  return new TextEncoder().encode(value).byteLength
}

function sanitizeWindow(window: BusyWindow, fallbackId: string): BusyWindow | null {
  const startMinutes = Math.max(0, Math.min(24 * 60 - 1, Math.round(window.startMinutes)))
  const endMinutes = Math.max(1, Math.min(24 * 60, Math.round(window.endMinutes)))
  if (endMinutes - startMinutes < 15) return null
  return {
    id: window.id || fallbackId,
    startMinutes,
    endMinutes,
  }
}

export function createEmptyAvailabilityDays() {
  return WEEKDAY_KEYS.reduce<Record<WeekdayKey, BusyWindow[]>>((accumulator, key) => {
    accumulator[key] = []
    return accumulator
  }, {} as Record<WeekdayKey, BusyWindow[]>)
}

function normalizeAvailability(data: Partial<WeeklyAvailability> | undefined, uid: string): WeeklyAvailability {
  const days = createEmptyAvailabilityDays()

  WEEKDAY_KEYS.forEach((dayKey) => {
    const rawWindows = Array.isArray(data?.days?.[dayKey]) ? data?.days?.[dayKey] : []
    days[dayKey] = rawWindows
      .map((window, index) => sanitizeWindow(window, `${dayKey}-${index + 1}`))
      .filter((window): window is BusyWindow => Boolean(window))
      .sort((left, right) => left.startMinutes - right.startMinutes)
  })

  return {
    uid,
    configured: data?.configured ?? true,
    timezoneOffsetMinutes: Number.isFinite(data?.timezoneOffsetMinutes)
      ? Number(data?.timezoneOffsetMinutes)
      : new Date().getTimezoneOffset(),
    days,
    updatedAt: data?.updatedAt ?? null,
    updatedAtClientMs: Number(data?.updatedAtClientMs ?? 0),
  }
}

export function subscribeToMeeting(
  coupleId: string,
  onChange: (meeting: MeetingState | null) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    doc(firestore, 'couples', coupleId, 'shared', 'meeting'),
    (snapshot) => onChange(snapshot.exists() ? snapshot.data() as MeetingState : null),
    () => onError?.('Не удалось синхронизировать время встречи'),
  )
}

export async function saveMeeting(coupleId: string, uid: string, meetingAtClientMs: number) {
  if (!Number.isFinite(meetingAtClientMs) || meetingAtClientMs <= 0) {
    throw new Error('Некорректная дата встречи')
  }

  const firestore = requireDb()
  await setDoc(
    doc(firestore, 'couples', coupleId, 'shared', 'meeting'),
    {
      meetingAtClientMs: Math.round(meetingAtClientMs),
      updatedBy: uid,
      updatedAt: serverTimestamp(),
      updatedAtClientMs: Date.now(),
    },
    { merge: true },
  )
}

export function subscribeToPartnerPhotos(
  coupleId: string,
  onChange: (photos: Record<string, PartnerPhoto>) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    collection(firestore, 'couples', coupleId, 'photos'),
    (snapshot) => {
      const next: Record<string, PartnerPhoto> = {}
      snapshot.docs.forEach((item) => {
        const photo = item.data() as PartnerPhoto
        if (photo.targetUid && photo.photoDataUrl) next[photo.targetUid] = photo
      })
      onChange(next)
    },
    () => onError?.('Не удалось синхронизировать фотографии'),
  )
}

export async function savePhotoForPartner(
  coupleId: string,
  uploadedBy: string,
  targetUid: string,
  photoDataUrl: string,
) {
  if (!uploadedBy || !targetUid || uploadedBy === targetUid) {
    throw new Error('Фото можно выбрать только для партнёра')
  }
  if (!photoDataUrl.startsWith('data:image/')) {
    throw new Error('Некорректное изображение')
  }
  if (encodedBytes(photoDataUrl) > MAX_PHOTO_DATA_URL_BYTES) {
    throw new Error('Фото получилось слишком большим')
  }

  const firestore = requireDb()
  await setDoc(
    doc(firestore, 'couples', coupleId, 'photos', targetUid),
    {
      targetUid,
      uploadedBy,
      photoDataUrl,
      updatedAt: serverTimestamp(),
      updatedAtClientMs: Date.now(),
    },
    { merge: true },
  )
}

export function subscribeToAvailability(
  coupleId: string,
  onChange: (availability: Record<string, WeeklyAvailability>) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    collection(firestore, 'couples', coupleId, 'availability'),
    (snapshot) => {
      const next: Record<string, WeeklyAvailability> = {}
      snapshot.docs.forEach((item) => {
        next[item.id] = normalizeAvailability(item.data() as WeeklyAvailability, item.id)
      })
      onChange(next)
    },
    () => onError?.('Не удалось синхронизировать расписание'),
  )
}

export async function saveAvailability(
  coupleId: string,
  uid: string,
  days: Record<WeekdayKey, BusyWindow[]>,
) {
  const normalized = normalizeAvailability({ uid, days, timezoneOffsetMinutes: new Date().getTimezoneOffset() }, uid)
  const firestore = requireDb()
  await setDoc(
    doc(firestore, 'couples', coupleId, 'availability', uid),
    {
      uid,
      configured: true,
      timezoneOffsetMinutes: normalized.timezoneOffsetMinutes,
      days: normalized.days,
      updatedAt: serverTimestamp(),
      updatedAtClientMs: Date.now(),
    },
    { merge: true },
  )
}

export function subscribeToPhotoOfDay(
  coupleId: string,
  onChange: (photos: Record<string, PhotoOfDay>) => void,
  onError?: (message: string) => void,
): Unsubscribe {
  const firestore = requireDb()
  return onSnapshot(
    collection(firestore, 'couples', coupleId, 'photoOfDay'),
    (snapshot) => {
      const next: Record<string, PhotoOfDay> = {}
      snapshot.docs.forEach((item) => {
        const photo = item.data() as PhotoOfDay
        if (photo.uid && photo.photoDataUrl) next[photo.uid] = photo
      })
      onChange(next)
    },
    () => onError?.('Не удалось синхронизировать фото дня'),
  )
}

function getLocalDayKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-')
}

export async function savePhotoOfDay(
  coupleId: string,
  uid: string,
  photoDataUrl: string,
  caption: string,
) {
  if (!photoDataUrl.startsWith('data:image/')) {
    throw new Error('Некорректное изображение')
  }
  if (encodedBytes(photoDataUrl) > MAX_PHOTO_DATA_URL_BYTES) {
    throw new Error('Фото получилось слишком большим')
  }

  const firestore = requireDb()
  await setDoc(
    doc(firestore, 'couples', coupleId, 'photoOfDay', uid),
    {
      uid,
      photoDataUrl,
      caption: caption.trim().slice(0, 120),
      dayKey: getLocalDayKey(),
      updatedAt: serverTimestamp(),
      updatedAtClientMs: Date.now(),
    },
    { merge: true },
  )
}

export async function compressImageToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Выбери изображение')
  if (file.size > MAX_SOURCE_FILE_BYTES) throw new Error('Фото слишком большое')

  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Не удалось открыть изображение'))
      element.src = objectUrl
    })

    let maxSide = 720
    let quality = 0.76

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
      const width = Math.max(1, Math.round(image.naturalWidth * scale))
      const height = Math.max(1, Math.round(image.naturalHeight * scale))
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')
      if (!context) throw new Error('Не удалось обработать изображение')
      context.drawImage(image, 0, 0, width, height)

      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      if (encodedBytes(dataUrl) <= MAX_PHOTO_DATA_URL_BYTES) return dataUrl

      if (quality > 0.46) quality -= 0.1
      else maxSide = Math.max(360, Math.round(maxSide * 0.82))
    }

    throw new Error('Фото всё ещё слишком большое — выбери другое')
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export const compressPartnerPhoto = compressImageToDataUrl
