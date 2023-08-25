import {Entity, model, property} from '@loopback/repository';

@model()
export class OrgUser extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id: string;

  @property({
    type: 'number',
  })
  orgId: number;

  @property({
    type: 'number',
  })
  userId: number;

  constructor(data?: Partial<OrgUser>) {
    super(data);
  }
}
