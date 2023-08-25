import {belongsTo, Entity, hasMany, model, property} from '@loopback/repository';

import {Issue} from './issue';
import {Org} from './org';

@model()
export class Proj extends Entity {
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
  title?: string;

  @belongsTo(() => Org, {name: 'org'})
  org_id?: number;

  @hasMany(() => Issue)
  issues: Issue[];

  constructor(data?: Partial<Proj>) {
    super(data);
  }
}

export interface ProjRelations {
  org: Org;
}

export type ProjWithRelations = Proj & ProjRelations;
