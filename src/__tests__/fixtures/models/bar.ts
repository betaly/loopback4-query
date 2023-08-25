import {belongsTo, Entity, model, property} from '@loopback/repository';

import {Foo} from './foo';

@model()
export class Bar extends Entity {
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

export interface BarRelations {
  foo?: Foo;
}

export type BarWithRelations = Bar & BarRelations;
