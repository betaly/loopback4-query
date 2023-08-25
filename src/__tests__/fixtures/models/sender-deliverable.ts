import {Entity, model, property} from '@loopback/repository';

@model()
export class SenderDeliverable extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id: number;

  @property()
  deliverableType: string;

  @property()
  deliverableId: number;

  @property()
  senderId: number;
}
