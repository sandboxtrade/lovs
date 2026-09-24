import { useState } from 'react'
import { ROOM_ITEMS, type RoomItemId } from '../../data/roomItems'
import type { Couple, UserProfile } from '../../types/models'
import { useGameProgress } from '../game/useGameProgress'
import { PetCard } from '../pet/PetCard'
import { usePet } from '../pet/usePet'
import { RoomScene } from './RoomScene'
import { buyRoomItem } from './worldService'
import { useWorld } from './useWorld'

type Props = {
  couple: Couple
  profile: UserProfile
}

export function WorldScreen({ couple, profile }: Props) {
  const { actions, progress, error: gameError } = useGameProgress(couple.id, couple.memberIds)
  const world = useWorld(couple.id, actions, progress)
  const pet = usePet(couple.id, profile.uid, couple.memberIds, actions, progress)
  const partnerId = couple.memberIds.find((id) => id !== profile.uid)
  const partnerName = partnerId ? couple.members[partnerId]?.displayName : undefined
  const [buyingId, setBuyingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleBuy(itemId: RoomItemId) {
    setBuyingId(itemId)
    setMessage(null)
    try {
      await buyRoomItem(couple.id, profile.uid, itemId, world.earnedCoins)
      setMessage('Предмет появился в вашей комнате')
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'Не удалось купить предмет')
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <>
      <section className="hero world-hero">
        <div>
          <p className="eyebrow">НАШ МИР</p>
          <h1>Наша комната</h1>
        </div>
        <div className="coin-balance" aria-label={`${world.availableCoins} монет`}>
          <span>●</span>
          <strong>{world.availableCoins}</strong>
        </div>
      </section>

      <section className="card room-card">
        <div className="section-title">
          <div>
            <span className="muted">Общее пространство</span>
            <h2>Комната уровня {progress.level}</h2>
          </div>
          <small className="room-count">{world.purchases.length}/{ROOM_ITEMS.length}</small>
        </div>
        <RoomScene ownedItemIds={world.ownedItemIds} pet={pet.view} />
        <p className="room-caption">Питомец и предметы общие: любое изменение сразу появляется у второго человека.</p>
      </section>

      <PetCard
        coupleId={couple.id}
        uid={profile.uid}
        state={pet.state}
        view={pet.view}
        memberName={partnerName}
      />

      {pet.error ? <p className="sync-warning">{pet.error}</p> : null}
      {gameError ? <p className="sync-warning">{gameError}</p> : null}

      <section className="card shop-card">
        <div className="section-title">
          <div>
            <span className="muted">За совместные действия</span>
            <h2>Магазин комнаты</h2>
          </div>
          <div className="shop-earned">
            <span>заработано</span>
            <strong>{world.earnedCoins}</strong>
          </div>
        </div>

        <div className="shop-grid">
          {ROOM_ITEMS.map((item) => {
            const owned = world.ownedItemIds.has(item.id)
            const affordable = world.availableCoins >= item.price
            return (
              <article className={`shop-item ${owned ? 'owned' : ''}`} key={item.id}>
                <div className="shop-item-icon" aria-hidden="true">{item.emoji}</div>
                <div className="shop-item-copy">
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                </div>
                <button
                  type="button"
                  disabled={owned || buyingId !== null || !affordable}
                  onClick={() => void handleBuy(item.id)}
                >
                  {owned ? 'Есть' : buyingId === item.id ? '…' : `● ${item.price}`}
                </button>
              </article>
            )
          })}
        </div>

        {message ? <p className="world-message">{message}</p> : null}
        {world.error ? <p className="sync-warning game-error">{world.error}</p> : null}
      </section>

      <section className="card economy-note">
        <span className="muted">Как растёт питомец</span>
        <p>Его развитие связано с XP пары. Поглаживания и игры меняют настроение, но не дают бесконечно фармить уровень — питомец взрослеет от ваших настоящих совместных действий.</p>
      </section>
    </>
  )
}
