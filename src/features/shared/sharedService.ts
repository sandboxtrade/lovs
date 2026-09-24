import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import type { MeetingState, PartnerPhoto } from '../../types/models'

const MAX_PHOTO_DATA_URL_BYTES = 700_000
const MAX_SOURCE_FILE_BYTES = 15 * 1024 * 1024

function requireDb() {
  if (!db) throw new Error('Firebase is not configured')
  return db
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
  if (new TextEncoder().encode(photoDataUrl).byteLength > MAX_PHOTO_DATA_URL_BYTES) {
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

function encodedBytes(value: string) {
  return new TextEncoder().encode(value).byteLength
}

export async function compressPartnerPhoto(file: File): Promise<string> {
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
