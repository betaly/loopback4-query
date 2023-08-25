import {Entity, hasMany, hasOne, model, property} from '@loopback/repository';

import {Org} from './org';
import {OrgUser} from './org-user';
import {UserInfo} from './user-info';

@model()
class Address extends Entity {
  @property()
  city: string;

  @property()
  street: string;
}

@model()
export class User extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  email?: string;

  @property()
  address: Address;

  @hasOne(() => UserInfo)
  userInfo: UserInfo;

  @hasMany(() => Org, {through: {model: () => OrgUser}})
  orgs: Org[];

  constructor(data?: Partial<User>) {
    super(data);
  }
}

export interface UserRelations {}

export type UserWithRelations = User & UserRelations;
