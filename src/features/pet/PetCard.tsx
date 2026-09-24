import { useState } from 'react'
import type { PetInteractionType, PetState } from '../../types/models'
import type { PetView } from './petLogic'
import { interactWithPet, renamePet } from './petService'

type Props = {
  coupleId: string
  uid: string
  state: PetState | null
  view: PetView
  memberName?: string
}

const ACTIONS: Array<{ type: PetInteractionType; label: string; emoji: string }> = [
  { type: 'pet', label: 'Погладить', emoji: '🤍' },
  { type: 'play', label: 'Поиграть', emoji: '🧶' },
  { type: 'rest', label: 'Уложить', emoji: '🌙' },
]

export function PetCard({ coupleId, uid, state, view, memberName }: Props) {
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(view.name)
  const [message, setMessage] = useState<string | null>(null)

  async function handleInteraction(type: PetInteractionType) {
    if (busy) return
    setBusy(true)
    setMessage(null)
    try {
      await interactWithPet(coupleId, uid, type)
    } catch {
      setMessage('Не удалось отправить действие')
    } finally {
      window.setTimeout(() => setBusy(false), 450)
    }
  }

  async function handleRename() {
    setBusy(true)
    setMessage(null)
    try {
      await renamePet(coupleId, name)
      setEditing(false)
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось изменить имя')
    } finally {
      setBusy(false)
    }
  }

  const lastActor = state?.lastInteractedBy === uid ? 'Ты' : memberName || 'Второй человек'

  return (
    <section className="card pet-card">
      <div className="pet-card-head">
        <div className={`pet-avatar stage-${view.stage.id} mood-${view.mood.id}`} aria-hidden="true">
          <span>{view.stage.emoji}</span>
          <i>{view.mood.emoji}</i>
        </div>
        <div className="pet-title">
          <span className="muted">Совместный питомец · {view.stage.label}</span>
          <div className="pet-name-row">
            <h2>{view.name}</h2>
            <button type="button" className="pet-edit" disabled={!state} onClick={() => { setName(view.name); setEditing((value) => !value) }}>Имя</button>
          </div>
          <small>{view.mood.label}</small>
        </div>
        <div className="pet-level"><span>ур.</span><strong>{view.petLevel}</strong></div>
      </div>

      {editing ? (
        <div className="pet-rename">
          <input
            value={name}
            maxLength={20}
            onChange={(event) => setName(event.target.value)}
            aria-label="Имя питомца"
          />
          <button type="button" disabled={busy} onClick={() => void handleRename()}>Сохранить</button>
        </div>
      ) : null}

      <div className="pet-progress-block">
        <div className="pet-progress-copy">
          <span>Развитие</span>
          <strong>{view.currentLevelXp}/{view.nextLevelXp} XP</strong>
        </div>
        <div className="progress-track pet-progress"><span style={{ width: `${view.levelProgress}%` }} /></div>
      </div>

      <div className="pet-thought">
        <span aria-hidden="true">“</span>
        <p>{view.reaction}</p>
      </div>

      <div className="pet-actions" aria-label="Действия с питомцем">
        {ACTIONS.map((action) => (
          <button type="button" key={action.type} disabled={busy || !state} onClick={() => void handleInteraction(action.type)}>
            <span aria-hidden="true">{action.emoji}</span>
            {action.label}
          </button>
        ))}
      </div>

      {state?.lastInteractionType && state.lastInteractionType !== 'none' ? (
        <small className="pet-last-action">Последнее взаимодействие: {lastActor}</small>
      ) : null}
      {message ? <p className="world-message pet-message">{message}</p> : null}
    </section>
  )
}
