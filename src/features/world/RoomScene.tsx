import { ROOM_ITEMS } from '../../data/roomItems'
import type { PetView } from '../pet/petLogic'

type Props = {
  ownedItemIds: Set<string>
  pet: PetView
}

export function RoomScene({ ownedItemIds, pet }: Props) {
  return (
    <div className="room-scene" aria-label="Ваша общая виртуальная комната">
      <div className="room-wall">
        <div className="room-window" aria-hidden="true"><span>☁</span><i /></div>
        <div className="room-sofa" aria-hidden="true"><i /><b /></div>
        <div className="room-table" aria-hidden="true" />
        <div className="room-floor" aria-hidden="true" />

        {ROOM_ITEMS.map((item) => ownedItemIds.has(item.id) ? (
          <div className={`room-owned-item ${item.sceneClass}`} key={item.id} title={item.name}>
            <span aria-hidden="true">{item.emoji}</span>
          </div>
        ) : null)}

        <div className={`room-pet room-pet-${pet.stage.id} mood-${pet.mood.id}`} title={`${pet.name}: ${pet.mood.label}`}>
          <span aria-hidden="true">{pet.stage.emoji}</span>
          <i aria-hidden="true">{pet.mood.emoji}</i>
          <b>{pet.name}</b>
        </div>
      </div>
    </div>
  )
}
