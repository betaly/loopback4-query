import {Entity, hasMany, model, property} from '@loopback/repository';

import {Deliverable} from './deliverable';
import {SenderDeliverable} from './sender-deliverable';

@model()
export class Sender extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id: number;

  @property()
  name: string;

  @hasMany(() => Deliverable, {through: {model: () => SenderDeliverable, polymorphic: true}})
  deliverables: Deliverable[];
}
