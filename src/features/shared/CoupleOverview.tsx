import { useEffect, useState, type ChangeEvent } from 'react'
import type { Couple, CoupleMember, MeetingState, PartnerPhoto, UserProfile } from '../../types/models'
import { compressPartnerPhoto, savePhotoForPartner } from './sharedService'

type Props = {
  profile: UserProfile
  couple: Couple
  partner?: CoupleMember
  partnerId?: string
  partnerPresenceLabel: string
  partnerOnline: boolean
  meeting: MeetingState | null
  photos: Record<string, PartnerPhoto>
  onOpenSettings: () => void
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '♡'
}

function formatCountdown(targetMs: number, now = Date.now()) {
  const diff = targetMs - now
  if (diff <= 0) return 'Время встречи наступило'
  const minutes = Math.floor(diff / 60_000)
  const days = Math.floor(minutes / 1440)
  const hours = Math.floor((minutes % 1440) / 60)
  const mins = minutes % 60
  if (days > 0) return `${days} дн ${hours} ч ${mins} мин`
  if (hours > 0) return `${hours} ч ${mins} мин`
  return `${Math.max(1, mins)} мин`
}

export function CoupleOverview({
  profile,
  couple,
  partner,
  partnerId,
  partnerPresenceLabel,
  partnerOnline,
  meeting,
  photos,
  onOpenSettings,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const countdown = meeting?.meetingAtClientMs
    ? formatCountdown(meeting.meetingAtClientMs, now)
    : null

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !partnerId) return
    setUploading(true)
    setMessage(null)
    try {
      const dataUrl = await compressPartnerPhoto(file)
      await savePhotoForPartner(couple.id, profile.uid, partnerId, dataUrl)
      setMessage('Фото для партнёра обновлено')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось загрузить фото')
    } finally {
      setUploading(false)
    }
  }

  const selfPhoto = photos[profile.uid]?.photoDataUrl
  const partnerPhoto = partnerId ? photos[partnerId]?.photoDataUrl : undefined

  return (
    <section className="relationship-overview">
      <div className="overview-topline">
        <div>
          <span className="overview-kicker">НАШЕ ПРОСТРАНСТВО</span>
          <h1>{couple.name || 'Мы'}</h1>
        </div>
        <button className="settings-button" type="button" onClick={onOpenSettings} aria-label="Настройки">⚙</button>
      </div>

      <div className="couple-portraits">
        <div className="portrait-person">
          <div className="portrait-frame">
            {selfPhoto ? <img src={selfPhoto} alt={`Фото ${profile.displayName}`} /> : <span>{initials(profile.displayName)}</span>}
          </div>
          <strong>{profile.displayName}</strong>
          <small>фото выбирает партнёр</small>
        </div>

        <div className="portrait-link" aria-hidden="true"><span>♥</span><i /></div>

        <div className="portrait-person">
          <div className="portrait-frame editable">
            {partnerPhoto ? <img src={partnerPhoto} alt={`Фото ${partner?.displayName ?? 'партнёра'}`} /> : <span>{initials(partner?.displayName ?? '♡')}</span>}
            {partnerId ? (
              <label className="photo-edit" aria-label="Выбрать фото для партнёра">
                <input type="file" accept="image/*" onChange={handlePhoto} disabled={uploading} />
                {uploading ? '…' : '＋'}
              </label>
            ) : null}
          </div>
          <strong>{partner?.displayName ?? 'Ждём партнёра'}</strong>
          <small>{partner ? partnerPresenceLabel : 'подключится по коду'}</small>
        </div>
      </div>

      <div className="overview-stats">
        <div>
          <span>До встречи</span>
          <strong>{countdown ?? 'не задано'}</strong>
        </div>
        <div>
          <span>Сейчас</span>
          <strong className={partnerOnline ? 'online-text' : ''}>{partner ? partnerPresenceLabel : '1 из 2'}</strong>
        </div>
      </div>

      {message ? <p className="overview-message">{message}</p> : null}
    </section>
  )
}
