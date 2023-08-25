import {belongsTo, Entity, model, property} from '@loopback/repository';

import {Proj} from './proj';
import {User} from './user';

@model()
export class Issue extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
  })
  title?: string;

  @property({
    type: 'boolean',
  })
  closed: boolean;

  @belongsTo(
    () => Proj,
    {keyFrom: 'projId', name: 'proj'},
    {
      name: 'projId',
      required: false,
    },
  )
  projId: number;

  @belongsTo(
    () => User,
    {keyFrom: 'creatorId', name: 'creator'},
    {
      name: 'creatorId',
      required: false,
    },
  )
  creatorId: number;
}

export interface IssueRelations {
  proj: Proj;
  creator: User;
}

export type IssueWithRelations = Issue & IssueRelations;
