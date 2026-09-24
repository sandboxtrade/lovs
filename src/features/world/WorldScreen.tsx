import { useState } from 'react'
import { ROOM_ITEMS, type RoomItemId } from '../../data/roomItems'
import type { Couple, UserProfile } from '../../types/models'
import { friendlyFirebaseError } from '../../utils/firebaseError'
import { formatInteger } from '../../utils/numberFormat'
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
      setMessage(friendlyFirebaseError(cause, 'Не удалось купить предмет'))
    } finally {
      setBuyingId(null)
    }
  }

  return (
    <div className="world-screen-premium">
      <section className="world-header-premium">
        <div className="world-header-copy">
          <p className="eyebrow">НАШ МИР</p>
          <h1>Ваш маленький общий дом</h1>
          <p>Он меняется вместе с вами — через совместные действия, питомца и вещи, которые вы открываете вдвоём.</p>
        </div>

        <div className="world-balance-premium" aria-label={`${formatInteger(world.availableCoins)} монет доступно`}>
          <span>●</span>
          <strong>{formatInteger(world.availableCoins)}</strong>
          <small>доступно</small>
        </div>
      </section>

      <section className="world-glance" aria-label="Состояние нашего мира">
        <div>
          <span>Уровень мира</span>
          <strong>{formatInteger(progress.level)}</strong>
        </div>
        <div>
          <span>В комнате</span>
          <strong>{formatInteger(world.purchases.length)} / {formatInteger(ROOM_ITEMS.length)}</strong>
        </div>
        <div>
          <span>Моти</span>
          <strong>{pet.view.mood.label}</strong>
        </div>
      </section>

      <section className="card room-card room-card-premium">
        <div className="room-card-head-premium">
          <div>
            <span className="room-card-overline">ОБЩАЯ КОМНАТА</span>
            <h2>Комната уровня {formatInteger(progress.level)}</h2>
          </div>
          <div className="room-count room-count-premium">{formatInteger(world.purchases.length)}/{formatInteger(ROOM_ITEMS.length)}</div>
        </div>
        <RoomScene ownedItemIds={world.ownedItemIds} pet={pet.view} />
        <div className="room-caption room-caption-premium">
          <span>Всё, что вы покупаете здесь, сразу появляется у вас обоих.</span>
          <small>Комната сохраняется между сессиями</small>
        </div>
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

      <section className="card shop-card shop-card-premium">
        <div className="shop-premium-head">
          <div>
            <span className="room-card-overline">МАГАЗИН КОМНАТЫ</span>
            <h2>Добавить уюта</h2>
            <p>Монеты зарабатываются вашими совместными действиями.</p>
          </div>
          <div className="shop-balance-premium">
            <span>Баланс</span>
            <strong>● {formatInteger(world.availableCoins)}</strong>
          </div>
        </div>

        <div className="shop-grid shop-grid-premium">
          {ROOM_ITEMS.map((item) => {
            const owned = world.ownedItemIds.has(item.id)
            const affordable = world.availableCoins >= item.price
            return (
              <article className={`shop-item shop-item-premium ${owned ? 'owned' : ''}`} key={item.id}>
                <div className="shop-item-icon shop-item-icon-premium" aria-hidden="true">{item.emoji}</div>
                <div className="shop-item-copy shop-item-copy-premium">
                  <strong>{item.name}</strong>
                  <small>{item.description}</small>
                </div>
                <div className="shop-item-action">
                  {owned ? <span className="shop-owned-badge">В комнате</span> : <small>{affordable ? 'доступно' : `не хватает ${formatInteger(item.price - world.availableCoins)}`}</small>}
                  <button
                    type="button"
                    disabled={owned || buyingId !== null || !affordable}
                    onClick={() => void handleBuy(item.id)}
                  >
                    {owned ? '✓' : buyingId === item.id ? '…' : `● ${formatInteger(item.price)}`}
                  </button>
                </div>
              </article>
            )
          })}
        </div>

        <div className="shop-earned-line">
          <span>Всего заработано</span>
          <strong>{formatInteger(world.earnedCoins)} монет</strong>
        </div>

        {message ? <p className="world-message">{message}</p> : null}
        {world.error ? <p className="sync-warning game-error">{world.error}</p> : null}
      </section>
    </div>
  )
}
