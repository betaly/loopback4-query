import {Entity, model, property} from '@loopback/repository';

@model()
export class Deliverable extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id: number;

  @property()
  address: string;

  @property()
  deliveryId: number;
}

export interface DeliverableRelations {
  // describe navigational properties here
}

@model()
export class Letter extends Deliverable {
  @property()
  letterTitle: string;
}

@model()
export class Parcel extends Deliverable {
  @property()
  parcelTitle: string;
}
