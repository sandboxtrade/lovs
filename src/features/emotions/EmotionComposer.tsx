import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { emotions, type EmotionId } from '../../data/emotions'
import type { EmotionState } from '../../types/models'
import { saveEmotion } from './emotionService'

type Props = {
  coupleId: string
  uid: string
  displayName: string
  current?: EmotionState
}

export function EmotionComposer({ coupleId, uid, displayName, current }: Props) {
  const [emotionId, setEmotionId] = useState<EmotionId | null>(
    (current?.emotionId as EmotionId | undefined) ?? null,
  )
  const [intensity, setIntensity] = useState(current?.intensity ?? 60)
  const [note, setNote] = useState(current?.note ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!current) return
    setEmotionId(current.emotionId as EmotionId)
    setIntensity(current.intensity)
    setNote(current.note ?? '')
  }, [current?.emotionId, current?.intensity, current?.note])

  const selected = useMemo(
    () => emotions.find((emotion) => emotion.id === emotionId),
    [emotionId],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!emotionId) {
      setError('Сначала выбери состояние')
      return
    }

    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      await saveEmotion(coupleId, uid, { emotionId, intensity, note })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 1800)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось сохранить состояние')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="card emotion-card">
      <div className="section-title">
        <div>
          <span className="muted">Привет, {displayName}</span>
          <h2>Как ты сейчас?</h2>
        </div>
        <span className="self-presence">● ты в сети</span>
      </div>

      <form className="emotion-form" onSubmit={handleSubmit}>
        <div className="mood-grid" role="list" aria-label="Выбор состояния">
          {emotions.map((emotion) => {
            const active = emotion.id === emotionId
            return (
              <button
                className={`mood ${active ? 'active' : ''}`}
                type="button"
                key={emotion.id}
                aria-pressed={active}
                onClick={() => {
                  setEmotionId(emotion.id)
                  setSaved(false)
                  setError(null)
                }}
              >
                <span aria-hidden="true">{emotion.emoji}</span>
                {emotion.label}
              </button>
            )
          })}
        </div>

        <div className="emotion-strength">
          <div className="strength-head">
            <label htmlFor="emotion-intensity">Сила состояния</label>
            <strong>{intensity}%</strong>
          </div>
          <input
            id="emotion-intensity"
            type="range"
            min="0"
            max="100"
            step="1"
            value={intensity}
            onChange={(event) => setIntensity(Number(event.target.value))}
          />
          <div className="strength-scale" aria-hidden="true">
            <span>слегка</span>
            <span>очень сильно</span>
          </div>
        </div>

        <label className="emotion-note">
          <span>Короткая мысль <small>необязательно</small></span>
          <textarea
            value={note}
            maxLength={140}
            rows={3}
            placeholder="Например: сегодня особенно скучаю"
            onChange={(event) => setNote(event.target.value)}
          />
          <small>{note.length}/140</small>
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <button className="primary-button emotion-save" type="submit" disabled={saving || !emotionId}>
          {saving ? 'Сохраняем…' : saved ? 'Состояние обновлено' : selected ? `Поделиться: ${selected.emoji} ${selected.label}` : 'Выбери состояние'}
        </button>
      </form>
    </section>
  )
}
