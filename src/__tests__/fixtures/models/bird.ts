import {belongsTo, Entity, model, property} from '@loopback/repository';

import {Foo} from './foo';

@model()
export class Bird extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id: number;

  @property()
  name: string;

  @belongsTo(() => Foo)
  fooId: number;
}

export interface BirdRelations {
  foo?: Foo;
}

export type BirdWithRelations = Bird & BirdRelations;
