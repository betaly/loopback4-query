import {DefaultCrudRepository, DefaultTransactionalRepository, Entity} from '@loopback/repository';

import {mixinQuery} from './decorators';
import {QueryEnhancedRepository} from './mixins';

@mixinQuery(true)
export class QueryEnhancedCrudRepository<
  T extends Entity,
  ID,
  Relations extends object = {},
> extends DefaultCrudRepository<T, ID, Relations> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface QueryEnhancedCrudRepository<T extends Entity, ID, Relations extends object = {}>
  extends QueryEnhancedRepository<T, Relations> {}

@mixinQuery(true)
export class QueryEnhancedTransactionalRepository<
  T extends Entity,
  ID,
  Relations extends object = {},
> extends DefaultTransactionalRepository<T, ID, Relations> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface QueryEnhancedTransactionalRepository<T extends Entity, ID, Relations extends object = {}>
  extends QueryEnhancedRepository<T, Relations> {}
