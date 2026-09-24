import { useState, type ChangeEvent } from 'react'
import type { Couple, CoupleMember, PartnerPhoto, UserProfile } from '../../types/models'
import { friendlyFirebaseError } from '../../utils/firebaseError'
import { compressPartnerPhoto, savePhotoForPartner } from './sharedService'

type Props = {
  profile: UserProfile
  couple: Couple
  partner?: CoupleMember
  partnerId?: string
  partnerPresenceLabel: string
  partnerOnline: boolean
  photos: Record<string, PartnerPhoto>
  meetingSummary: string
  meetingDetail: string
  onOpenSettings: () => void
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase() || '♡'
}

export function CoupleOverview({
  profile,
  couple,
  partner,
  partnerId,
  partnerPresenceLabel,
  partnerOnline,
  photos,
  meetingSummary,
  meetingDetail,
  onOpenSettings,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !partnerId) return
    setUploading(true)
    setMessage(null)
    setError(null)
    try {
      const dataUrl = await compressPartnerPhoto(file)
      await savePhotoForPartner(couple.id, profile.uid, partnerId, dataUrl)
      setMessage(`Фото для ${partner?.displayName ?? 'партнёра'} обновлено`)
    } catch (cause) {
      setError(friendlyFirebaseError(cause, 'Не удалось загрузить фото'))
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
          <div className="portrait-frame portrait-frame-self">
            {selfPhoto
              ? <img src={selfPhoto} alt={`Фото ${profile.displayName}`} />
              : <span className="portrait-initial">{initials(profile.displayName)}</span>}
          </div>
          <strong>{profile.displayName}</strong>
          <small>{partner ? `это фото тебе выбрал ${partner.displayName}` : 'твоё фото здесь выберет партнёр'}</small>
        </div>

        <div className="portrait-link" aria-hidden="true"><span>♥</span><i /></div>

        <div className="portrait-person">
          {partnerId ? (
            <label className={`portrait-frame editable portrait-frame-partner ${uploading ? 'is-uploading' : ''}`} aria-label={`Выбрать фото для ${partner?.displayName ?? 'партнёра'}`}>
              {partnerPhoto
                ? <img src={partnerPhoto} alt={`Фото ${partner?.displayName ?? 'партнёра'}`} />
                : <span className="portrait-initial">{initials(partner?.displayName ?? '♡')}</span>}
              <input type="file" accept="image/*" onChange={handlePhoto} disabled={uploading} />
              <span className="photo-edit" aria-hidden="true">{uploading ? '…' : '＋'}</span>
            </label>
          ) : (
            <div className="portrait-frame portrait-frame-partner">
              <span className="portrait-initial">{initials(partner?.displayName ?? '♡')}</span>
            </div>
          )}
          <strong>{partner?.displayName ?? 'Ждём партнёра'}</strong>
          <small>{partner ? `${partnerPresenceLabel} · нажми на фото, чтобы выбрать его` : 'подключится по коду'}</small>
        </div>
      </div>

      <div className="overview-stats overview-stats-polished">
        <div className="overview-stat-primary">
          <span>До встречи</span>
          <strong>{meetingSummary}</strong>
          <small>{meetingDetail}</small>
        </div>
        <div>
          <span>Сейчас</span>
          <strong className={partnerOnline ? 'online-text' : ''}>{partner ? partnerPresenceLabel : '1 из 2'}</strong>
          <small>{partner ? 'статус виден у вас обоих сразу' : 'нужно подключить второй аккаунт'}</small>
        </div>
      </div>

      {error ? <p className="form-error overview-feedback" role="alert">{error}</p> : null}
      {message ? <p className="overview-message overview-feedback">{message}</p> : null}
    </section>
  )
}
