import { useEffect, useState } from 'react'
import type { MeetingState, PartnerPhoto } from '../../types/models'
import { subscribeToMeeting, subscribeToPartnerPhotos } from './sharedService'

export function useSharedSpace(coupleId: string) {
  const [meeting, setMeeting] = useState<MeetingState | null>(null)
  const [photos, setPhotos] = useState<Record<string, PartnerPhoto>>({})
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stopMeeting = subscribeToMeeting(coupleId, setMeeting, setError)
    const stopPhotos = subscribeToPartnerPhotos(coupleId, setPhotos, setError)
    return () => {
      stopMeeting()
      stopPhotos()
    }
  }, [coupleId])

  return { meeting, photos, error }
}
