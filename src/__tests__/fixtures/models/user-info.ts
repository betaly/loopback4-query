import {Entity, model, property} from '@loopback/repository';

@model()
export class UserInfo extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id: number;

  @property({
    type: 'number',
    required: true,
  })
  userId: number;

  @property()
  info: string;

  @property()
  a: number;

  @property()
  b: number;

  constructor(data?: Partial<UserInfo>) {
    super(data);
  }
}
