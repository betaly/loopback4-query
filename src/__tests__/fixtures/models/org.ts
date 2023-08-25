import {Entity, hasMany, model, property} from '@loopback/repository';

import {OrgUser} from './org-user';
import {Proj} from './proj';
import {User} from './user';

@model()
export class Org extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
  })
  name: string;

  @property({
    type: 'string',
  })
  baseRepoRole: string;

  @property({
    type: 'string',
    name: 'billing_address',
  })
  billingAddress: string;

  @hasMany(() => User, {through: {model: () => OrgUser}})
  users: User[];

  @hasMany(() => Proj, {keyTo: 'org_id'})
  projs: Proj[];

  constructor(data?: Partial<Org>) {
    super(data);
  }
}
