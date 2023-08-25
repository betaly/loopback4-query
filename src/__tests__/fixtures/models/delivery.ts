import {Entity, hasOne, model, property} from '@loopback/repository';

import {Deliverable} from './deliverable';

@model()
export class Delivery extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id: number;

  @hasOne(() => Deliverable, {polymorphic: true})
  deliverable: Deliverable;

  @property()
  deliverableType: string;
}
