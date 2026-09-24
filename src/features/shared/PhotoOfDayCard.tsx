import { useEffect, useState, type ChangeEvent } from 'react'
import type { Couple, CoupleMember, PhotoOfDay, UserProfile } from '../../types/models'
import { compressImageToDataUrl, savePhotoOfDay } from './sharedService'

type Props = {
  couple: Couple
  profile: UserProfile
  partner?: CoupleMember
  photos: Record<string, PhotoOfDay>
}

function formatDayKey(dayKey?: string) {
  if (!dayKey) return 'ещё не загружено'
  const date = new Date(`${dayKey}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 'сегодня'
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

export function PhotoOfDayCard({ couple, profile, partner, photos }: Props) {
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState(photos[profile.uid]?.caption ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const partnerId = couple.memberIds.find((id) => id !== profile.uid)
  const selfPhoto = photos[profile.uid]
  const partnerPhoto = partnerId ? photos[partnerId] : undefined

  useEffect(() => {
    setCaption(selfPhoto?.caption ?? '')
  }, [profile.uid, selfPhoto?.updatedAtClientMs])

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setMessage(null)
    try {
      const dataUrl = await compressImageToDataUrl(file)
      await savePhotoOfDay(couple.id, profile.uid, dataUrl, caption)
      setMessage('Фото дня обновлено')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось сохранить фото дня')
    } finally {
      setUploading(false)
    }
  }

  async function saveCaptionOnly() {
    if (!selfPhoto?.photoDataUrl) {
      setMessage('Сначала загрузи фотографию')
      return
    }
    setUploading(true)
    setMessage(null)
    try {
      await savePhotoOfDay(couple.id, profile.uid, selfPhoto.photoDataUrl, caption)
      setMessage('Подпись обновлена')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось обновить подпись')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="card photo-day-card">
      <div className="section-title photo-day-title">
        <div>
          <span className="muted">Новый общий ритуал</span>
          <h2>Фото дня</h2>
        </div>
        <small>по одной любимой фотографии от каждого</small>
      </div>

      <div className="photo-day-grid">
        <article className="photo-day-slot own">
          <div className="photo-day-image-wrap">
            {selfPhoto?.photoDataUrl ? <img src={selfPhoto.photoDataUrl} alt="Твоё фото дня" className="photo-day-image" /> : <div className="photo-day-empty">＋</div>}
            <label className="photo-day-upload">
              <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
              {uploading ? '…' : selfPhoto?.photoDataUrl ? 'Сменить' : 'Загрузить'}
            </label>
          </div>
          <div className="photo-day-copy">
            <strong>{profile.displayName}</strong>
            <span>{formatDayKey(selfPhoto?.dayKey)}</span>
            <textarea
              value={caption}
              maxLength={120}
              placeholder="Почему именно эта фотография?"
              onChange={(event) => setCaption(event.target.value)}
            />
            <button type="button" className="soft-button photo-day-caption-save" disabled={uploading || caption.trim() === (selfPhoto?.caption ?? '')} onClick={() => void saveCaptionOnly()}>
              Сохранить подпись
            </button>
          </div>
        </article>

        <article className="photo-day-slot partner">
          <div className="photo-day-image-wrap partner-view">
            {partnerPhoto?.photoDataUrl ? <img src={partnerPhoto.photoDataUrl} alt="Фото дня партнёра" className="photo-day-image" /> : <div className="photo-day-empty">♡</div>}
          </div>
          <div className="photo-day-copy">
            <strong>{partner?.displayName ?? 'Партнёр'}</strong>
            <span>{formatDayKey(partnerPhoto?.dayKey)}</span>
            <p>{partnerPhoto?.caption?.trim() ? `«${partnerPhoto.caption}»` : 'Здесь появится любимая фотография партнёра за сегодняшний день.'}</p>
          </div>
        </article>
      </div>

      {message ? <p className="planner-message photo-day-message">{message}</p> : null}
    </section>
  )
}
