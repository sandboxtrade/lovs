import type { RoomItemDefinition } from '../../data/roomItems'
import { ROOM_ITEMS } from '../../data/roomItems'
import type { PetView } from '../pet/petLogic'

type Props = {
  ownedItemIds: Set<string>
  pet: PetView
}

function OwnedDecoration({ item }: { item: RoomItemDefinition }) {
  if (item.id === 'rug') {
    return <div className="room-decor room-decor-rug" aria-label={item.name} />
  }

  if (item.id === 'lamp') {
    return (
      <div className="room-decor room-decor-lamp" aria-label={item.name}>
        <i className="room-lamp-glow" />
        <i className="room-lamp-shade" />
        <i className="room-lamp-stand" />
        <i className="room-lamp-base" />
      </div>
    )
  }

  if (item.id === 'bookshelf') {
    return (
      <div className="room-decor room-decor-bookshelf" aria-label={item.name}>
        <i /><i /><i />
        <span>▥ ▥ ▥</span>
      </div>
    )
  }

  if (item.id === 'photo_wall') {
    return <div className="room-decor room-decor-photo" aria-label={item.name}><span>♡</span></div>
  }

  if (item.id === 'moon_light') {
    return <div className="room-decor room-decor-moon" aria-label={item.name}><i /><span>☾</span></div>
  }

  return <div className="room-decor room-decor-plant" aria-label={item.name}><span>🪴</span></div>
}

export function RoomScene({ ownedItemIds, pet }: Props) {
  const ownedItems = ROOM_ITEMS.filter((item) => ownedItemIds.has(item.id))

  return (
    <div className="room-scene room-scene-stable" aria-label="Ваша общая виртуальная комната">
      <div className="room-backdrop">
        <div className="room-window-stable" aria-hidden="true">
          <span>☾</span>
          <i />
        </div>
        <div className="room-picture-stable" aria-hidden="true">♡</div>
        <div className="room-sofa-stable" aria-hidden="true">
          <i /><b /><span />
        </div>
        <div className="room-table-stable" aria-hidden="true"><i /><b /></div>
        <div className="room-floor-stable" aria-hidden="true" />

        {ownedItems.map((item) => <OwnedDecoration key={item.id} item={item} />)}

        <div className={`room-pet-stable mood-${pet.mood.id}`} title={`${pet.name}: ${pet.mood.label}`}>
          <span aria-hidden="true">{pet.stage.emoji}</span>
          <i aria-hidden="true">{pet.mood.emoji}</i>
          <b>{pet.name}</b>
        </div>
      </div>

      {ownedItems.length ? (
        <div className="room-owned-strip" aria-label="Предметы в комнате">
          {ownedItems.map((item) => <span key={item.id}>{item.emoji}<small>{item.name}</small></span>)}
        </div>
      ) : null}
    </div>
  )
}
