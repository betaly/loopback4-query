/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  DefaultCrudRepository,
  Entity,
  EntityCrudRepository,
  includeRelatedModels,
  juggler,
  Options,
} from '@loopback/repository';
import {assert} from 'tily/assert';
import {PickKeys} from 'ts-essentials';

import {Driver} from './driver';
import {loadDriver} from './driver.loader';
import {QueryFilter, QueryWhere} from './filter';
import {EntityClass} from './types';

export interface Query<T extends Entity, Relations extends object = {}> {
  entityClass: EntityClass<T>;

  /**
   * Find matching records
   *
   * @param filter - Query filter
   * @param options - Options for the operations
   * @returns A promise of an array of records found
   */
  find(filter?: QueryFilter<T>, options?: Options): Promise<(T & Relations)[]>;

  /**
   * Find one record that matches filter specification. Same as find, but limited to one result; Returns object, not collection.
   *
   * @param filter - Query filter
   * @param options - Options for the operations
   * @returns A promise of a record found
   */
  findOne(filter?: QueryFilter<T>, options?: Options): Promise<(T & Relations) | null>;

  /**
   * Count matching records
   * @param where - Matching criteria
   * @param options - Options for the operations
   * @returns A promise of number of records matched
   */
  count(where?: QueryWhere<T>, options?: Options): Promise<{count: number}>;
}

export const QueryMethods: PickKeys<Query<Entity>, (...args: any) => any>[] = ['find', 'findOne', 'count'];

export const QueryProperties: (keyof Query<Entity>)[] = ['entityClass', ...QueryMethods];

export class DefaultQuery<T extends Entity, Relations extends object = {}> implements Query<T, Relations> {
  public readonly entityClass: EntityClass<T>;
  public readonly dataSource: juggler.DataSource;
  public readonly repo?: EntityCrudRepository<T, unknown, Relations>;
  public readonly driver: Driver;

  constructor(repo: EntityCrudRepository<T, unknown, Relations>, dataSource?: juggler.DataSource);
  constructor(entityClass: EntityClass<T>, dataSource: juggler.DataSource);
  constructor(
    entityClassOrRepo: EntityClass<T> | EntityCrudRepository<T, unknown, Relations>,
    ds?: juggler.DataSource,
  ) {
    if (typeof entityClassOrRepo === 'function') {
      this.entityClass = entityClassOrRepo;
      this.dataSource = ds!;
    } else {
      this.repo = entityClassOrRepo;
      this.entityClass = entityClassOrRepo.entityClass;
      this.dataSource = ds ?? (entityClassOrRepo as any).dataSource;
    }
    assert(this.dataSource, 'dataSource is required');
    this.driver = loadDriver(this.dataSource);
  }

  async find(filter?: QueryFilter<T>, options?: Options): Promise<(T & Relations)[]> {
    filter = filter ?? {};
    const data = await this.driver.find(this.entityClass, filter, options);
    const modelClass = this.dataSource.getModel(this.entityClass.definition.name);
    if (!modelClass) {
      throw new Error(`Model class ${this.entityClass.definition.name} not found`);
    }
    const objects = data
      .map(
        m =>
          new modelClass(m, {
            fields: filter?.fields,
            applySetters: false,
            persisted: true,
            // see https://github.com/strongloop/loopback-datasource-juggler/issues/1692
            applyDefaultValues: false,
          }),
      )
      .map(m => m.toObject());

    const entities = this.toEntities(objects);
    if (this.repo) {
      return includeRelatedModels(this.repo, entities, filter.include, options);
    }
    return entities as (T & Relations)[];
  }

  async findOne(filter?: QueryFilter<T>, options?: Options): Promise<(T & Relations) | null> {
    filter = filter ?? {};
    filter.limit = 1;
    const result = await this.find(filter, options);
    return result[0] ?? null;
  }

  async count(where?: QueryWhere<T>, options?: Options): Promise<{count: number}> {
    return this.driver.count(this.entityClass, where, options);
  }

  protected toEntity<R extends T>(model: Record<string, any>): R {
    return new this.entityClass(model) as R;
  }

  protected toEntities<R extends T>(models: Record<string, any>[]): R[] {
    return models.map(m => this.toEntity<R>(m));
  }
}

export function isQuery<T extends Entity>(obj: any): obj is Query<T> {
  return (
    obj &&
    (obj instanceof DefaultQuery || (QueryProperties.every(p => p in obj) && !(obj instanceof DefaultCrudRepository)))
  );
}
