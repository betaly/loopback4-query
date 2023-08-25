import {belongsTo, Entity, model, property} from '@loopback/repository';

import {Deliverable} from './deliverable';

@model()
export class Transport extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id: number;

  @property()
  name: string;

  @belongsTo(() => Deliverable, {polymorphic: true})
  deliverableId: number;

  @property()
  deliverableType: string;
}
