import { useEffect, useMemo, useState } from 'react'
import type { MeetingState, PartnerPhoto, PhotoOfDay, WeeklyAvailability } from '../../types/models'
import {
  createEmptyAvailabilityDays,
  subscribeToAvailability,
  subscribeToMeeting,
  subscribeToPartnerPhotos,
  subscribeToPhotoOfDay,
} from './sharedService'

export function useSharedSpace(coupleId: string) {
  const [meeting, setMeeting] = useState<MeetingState | null>(null)
  const [photos, setPhotos] = useState<Record<string, PartnerPhoto>>({})
  const [availability, setAvailability] = useState<Record<string, WeeklyAvailability>>({})
  const [photoOfDay, setPhotoOfDay] = useState<Record<string, PhotoOfDay>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stopMeeting = subscribeToMeeting(coupleId, setMeeting, setError)
    const stopPhotos = subscribeToPartnerPhotos(coupleId, setPhotos, setError)
    const stopAvailability = subscribeToAvailability(coupleId, setAvailability, setError)
    const stopPhotoOfDay = subscribeToPhotoOfDay(coupleId, setPhotoOfDay, setError)
    return () => {
      stopMeeting()
      stopPhotos()
      stopAvailability()
      stopPhotoOfDay()
    }
  }, [coupleId])

  const emptyAvailability = useMemo(() => ({
    uid: '',
    timezoneOffsetMinutes: new Date().getTimezoneOffset(),
    days: createEmptyAvailabilityDays(),
    updatedAtClientMs: 0,
    updatedAt: null,
  }), [])

  return { meeting, photos, availability, photoOfDay, emptyAvailability, error }
}
