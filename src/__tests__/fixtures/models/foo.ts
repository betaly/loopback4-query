import {Entity, hasMany, model, property} from '@loopback/repository';

import {Bar} from './bar';
import {Bird} from './bird';

@model()
export class Foo extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id: number;

  @property()
  name: string;

  @property()
  a?: number;

  @property()
  b?: number;

  @property()
  c?: number;

  @hasMany(() => Bar)
  bars: Bar[];

  @hasMany(() => Bird)
  birds: Bird[];

  constructor(data?: Partial<Foo>) {
    super(data);
  }
}
