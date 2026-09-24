import { useState } from 'react'
import { touches, type TouchType } from '../../data/touches'
import { sendTouch } from './touchService'

type Props = {
  coupleId: string
  fromUid: string
  toUid?: string
}

export function TouchActions({ coupleId, fromUid, toUid }: Props) {
  const [sending, setSending] = useState<TouchType | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSend(type: TouchType, label: string) {
    if (!toUid || sending) return
    setSending(type)
    setError(null)
    try {
      await sendTouch(coupleId, fromUid, toUid, type)
      setFeedback(`${label} отправлено`)
      window.setTimeout(() => setFeedback(null), 1800)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось отправить')
    } finally {
      setSending(null)
    }
  }

  return (
    <div className="touch-actions-wrap">
      <div className="touch-actions" aria-label="Быстрые касания">
        {touches.map((touch) => (
          <button
            key={touch.id}
            type="button"
            disabled={!toUid || Boolean(sending)}
            onClick={() => void handleSend(touch.id, touch.label)}
          >
            <span aria-hidden="true">{touch.emoji}</span>
            <small>{sending === touch.id ? 'Отправляю…' : touch.label}</small>
          </button>
        ))}
      </div>
      {feedback ? <p className="touch-feedback" role="status">{feedback}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  )
}
