import type { RoomItemId } from '../../data/roomItems'
import { ROOM_ITEMS } from '../../data/roomItems'
import type { PetView } from '../pet/petLogic'

type Props = {
  ownedItemIds: Set<string>
  pet: PetView
}

function RoomOwnedItem({ itemId }: { itemId: RoomItemId }) {
  if (itemId === 'plant') {
    return <div className="room-owned-item room-item-plant" aria-hidden="true"><i /><b /><span /></div>
  }

  if (itemId === 'lamp') {
    return <div className="room-owned-item room-item-lamp" aria-hidden="true"><i /><b /><span /></div>
  }

  if (itemId === 'rug') {
    return <div className="room-owned-item room-item-rug" aria-hidden="true" />
  }

  if (itemId === 'photo_wall') {
    return <div className="room-owned-item room-item-photo" aria-hidden="true"><i /><b /></div>
  }

  if (itemId === 'bookshelf') {
    return <div className="room-owned-item room-item-bookshelf" aria-hidden="true"><i /><b /><span /></div>
  }

  if (itemId === 'moon_light') {
    return <div className="room-owned-item room-item-moon" aria-hidden="true"><i /><span>☾</span></div>
  }

  return null
}

export function RoomScene({ ownedItemIds, pet }: Props) {
  return (
    <div className="room-scene room-scene-polished" aria-label="Ваша общая виртуальная комната">
      <div className="room-wall">
        <div className="room-ambient room-ambient-one" aria-hidden="true" />
        <div className="room-ambient room-ambient-two" aria-hidden="true" />
        <div className="room-window" aria-hidden="true"><span>☾</span><i /></div>
        <div className="room-wall-art" aria-hidden="true"><span>♡</span></div>
        <div className="room-shelf" aria-hidden="true"><i /><i /><i /></div>
        <div className="room-floor-shadow" aria-hidden="true" />
        <div className="room-rug-base" aria-hidden="true" />
        <div className="room-sofa" aria-hidden="true"><i /><b /><em /></div>
        <div className="room-table" aria-hidden="true"><span>✦</span><i /></div>
        <div className="room-floor" aria-hidden="true" />

        {ROOM_ITEMS.map((item) => ownedItemIds.has(item.id) ? <RoomOwnedItem key={item.id} itemId={item.id} /> : null)}

        <div className={`room-pet room-pet-${pet.stage.id} mood-${pet.mood.id}`} title={`${pet.name}: ${pet.mood.label}`}>
          <span aria-hidden="true">{pet.stage.emoji}</span>
          <i aria-hidden="true">{pet.mood.emoji}</i>
          <b>{pet.name}</b>
        </div>
      </div>
    </div>
  )
}
