import {DefaultCrudRepository, DefaultTransactionalRepository, Entity} from '@loopback/repository';

import {mixinQuery} from './decorators';
import {QueryEnhancedRepository} from './mixins';

/**
 * Query enhanced repository with default CRUD methods overwritten
 */
@mixinQuery(true)
export class QueryEnhancedCrudRepository<
  T extends Entity,
  ID,
  Relations extends object = {},
> extends DefaultCrudRepository<T, ID, Relations> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface QueryEnhancedCrudRepository<T extends Entity, ID, Relations extends object = {}>
  extends QueryEnhancedRepository<T, Relations> {}

/**
 * Query enhanced transactional repository with default CRUD methods overwritten
 */
@mixinQuery(true)
export class QueryEnhancedTransactionalCrudRepository<
  T extends Entity,
  ID,
  Relations extends object = {},
> extends DefaultTransactionalRepository<T, ID, Relations> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface QueryEnhancedTransactionalCrudRepository<T extends Entity, ID, Relations extends object = {}>
  extends QueryEnhancedRepository<T, Relations> {}

/**
 * Query enhanced repository without overwriting the default CRUD methods
 */
@mixinQuery()
export class CrudRepositoryWithQuery<T extends Entity, ID, Relations extends object = {}> extends DefaultCrudRepository<
  T,
  ID,
  Relations
> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface CrudRepositoryWithQuery<T extends Entity, ID, Relations extends object = {}>
  extends QueryEnhancedRepository<T, Relations> {}

/**
 * Query enhanced transactional repository without overwriting the default CRUD methods
 */
@mixinQuery()
export class TransactionalCrudRepositoryWithQuery<
  T extends Entity,
  ID,
  Relations extends object = {},
> extends DefaultTransactionalRepository<T, ID, Relations> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface TransactionalCrudRepositoryWithQuery<T extends Entity, ID, Relations extends object = {}>
  extends QueryEnhancedRepository<T, Relations> {}
