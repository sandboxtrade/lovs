import { useEffect, useMemo, useState } from 'react'
import type { PartnerPhoto, PhotoOfDay, WeeklyAvailability } from '../../types/models'
import {
  createEmptyAvailabilityDays,
  subscribeToAvailability,
  subscribeToPartnerPhotos,
  subscribeToPhotoOfDay,
} from './sharedService'

type SharedErrors = {
  photos: string | null
  availability: string | null
  photoOfDay: string | null
}

const EMPTY_ERRORS: SharedErrors = { photos: null, availability: null, photoOfDay: null }

export function useSharedSpace(coupleId: string) {
  const [photos, setPhotos] = useState<Record<string, PartnerPhoto>>({})
  const [availability, setAvailability] = useState<Record<string, WeeklyAvailability>>({})
  const [photoOfDay, setPhotoOfDay] = useState<Record<string, PhotoOfDay>>({})
  const [errors, setErrors] = useState<SharedErrors>(EMPTY_ERRORS)

  useEffect(() => {
    setErrors(EMPTY_ERRORS)

    const stopPhotos = subscribeToPartnerPhotos(
      coupleId,
      (next) => {
        setPhotos(next)
        setErrors((current) => ({ ...current, photos: null }))
      },
      (message) => setErrors((current) => ({ ...current, photos: message })),
    )

    const stopAvailability = subscribeToAvailability(
      coupleId,
      (next) => {
        setAvailability(next)
        setErrors((current) => ({ ...current, availability: null }))
      },
      (message) => setErrors((current) => ({ ...current, availability: message })),
    )

    const stopPhotoOfDay = subscribeToPhotoOfDay(
      coupleId,
      (next) => {
        setPhotoOfDay(next)
        setErrors((current) => ({ ...current, photoOfDay: null }))
      },
      (message) => setErrors((current) => ({ ...current, photoOfDay: message })),
    )

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

  const error = errors.photos ?? errors.photoOfDay ?? errors.availability

  return { photos, availability, photoOfDay, emptyAvailability, error, errors }
}
