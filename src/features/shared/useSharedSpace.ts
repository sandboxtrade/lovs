import { useEffect, useMemo, useState } from 'react'
import type { PartnerPhoto, PhotoOfDay, WeeklyAvailability } from '../../types/models'
import {
  createEmptyAvailabilityDays,
  subscribeToAvailability,
  subscribeToPartnerPhotos,
  subscribeToPhotoOfDay,
} from './sharedService'

export function useSharedSpace(coupleId: string) {
  const [photos, setPhotos] = useState<Record<string, PartnerPhoto>>({})
  const [availability, setAvailability] = useState<Record<string, WeeklyAvailability>>({})
  const [photoOfDay, setPhotoOfDay] = useState<Record<string, PhotoOfDay>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stopPhotos = subscribeToPartnerPhotos(coupleId, setPhotos, setError)
    const stopAvailability = subscribeToAvailability(coupleId, setAvailability, setError)
    const stopPhotoOfDay = subscribeToPhotoOfDay(coupleId, setPhotoOfDay, setError)
    return () => {
      stopPhotos()
      stopAvailability()
      stopPhotoOfDay()
    }
  }, [coupleId])

  const emptyAvailability = useMemo(() => ({
    uid: '',
    configured: false,
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    days: createEmptyAvailabilityDays(),
    updatedAtClientMs: 0,
    updatedAt: null,
  }), [])

  return { photos, availability, photoOfDay, emptyAvailability, error }
}
