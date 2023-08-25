import {Context, inject, Injection} from '@loopback/core';
import {Class, Entity, juggler, Model, Repository} from '@loopback/repository';
import {assert} from 'tily/assert';

import {DefaultQuery, isQuery} from '../query';

import DataSource = juggler.DataSource;

/**
 * Type definition for decorators returned by `@repository` decorator factory
 */
export type QueryDecorator = (
  target: Object,
  key?: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptorOrIndex?: TypedPropertyDescriptor<any> | number,
) => void;

/**
 * Metadata for a query
 */
export class QueryMetadata {
  /**
   * Name of the predefined repository
   */
  name?: string;
  /**
   * Name of the model
   */
  modelName?: string;
  /**
   * Class of the model
   */
  modelClass?: typeof Entity;
  /**
   * Name of the data source
   */
  dataSourceName?: string;
  /**
   * Instance of the data source
   */
  dataSource?: juggler.DataSource | DataSource;

  /**
   * Constructor for QueryMetadata
   *
   * @param modelOrRepo - Name or class of the model. If the value is a string and
   * `dataSource` is not present, it will be treated as the name of a predefined
   * select query
   * @param dataSource - Name or instance of the data source
   *
   * For example:
   *
   * - new QueryMetadata(repoName);
   * - new QueryMetadata(modelName, dataSourceName);
   * - new QueryMetadata(modelClass, dataSourceInstance);
   * - new QueryMetadata(modelName, dataSourceInstance);
   * - new QueryMetadata(modelClass, dataSourceName);
   */
  constructor(modelOrRepo: string | typeof Entity, dataSource?: string | juggler.DataSource | DataSource) {
    this.name = typeof modelOrRepo === 'string' && dataSource === undefined ? modelOrRepo : undefined;
    this.modelName = typeof modelOrRepo === 'string' && dataSource != null ? modelOrRepo : undefined;
    this.modelClass = typeof modelOrRepo === 'function' ? modelOrRepo : undefined;
    this.dataSourceName = typeof dataSource === 'string' ? dataSource : undefined;
    this.dataSource = typeof dataSource === 'object' ? dataSource : undefined;
  }
}

/**
 * Decorator for query injections on properties or method arguments
 *
 * @example
 * ```ts
 * class CustomerController {
 *   @query(CustomerRepository) public custQuery: Query<Customer>;
 *
 *   constructor(
 *     @query(ProductRepository) public prodQuery: Query<Product>,
 *   ) {}
 *
 * }
 * ```
 *
 * @param repositoryName - Name of the repo
 */
export function query(repositoryName: string | Class<Repository<Model>>): QueryDecorator;

/**
 * Decorator for Query generation and injection on properties
 * or method arguments based on the given model and dataSource (or their names)
 *
 * @example
 * ```ts
 * class CustomerController {
 *   @query('Customer', 'mySqlDataSource')
 *   public custQuery: Query<Customer>;
 *
 *   constructor(
 *     @query(Product, mySqlDataSource)
 *     public prodQuery: Query<Product>,
 *   ) {}
 * }
 * ```
 *
 * @param model - Name/class of the model
 * @param dataSource - Name/instance of the dataSource
 */
export function query(model: string | typeof Entity, dataSource: string | juggler.DataSource): QueryDecorator;

export function query(
  modelOrRepo: string | Class<Repository<Model>> | typeof Entity,
  dataSource?: string | juggler.DataSource,
): QueryDecorator {
  // if string, repository or not a model ctor,
  // keep it a string / assign to ctor's name (string) for DI
  const stringOrModel =
    typeof modelOrRepo !== 'string' && !modelOrRepo.prototype.getId ? modelOrRepo.name : (modelOrRepo as typeof Entity);
  const meta = new QueryMetadata(stringOrModel, dataSource);
  return function (
    target: Object,
    key?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    descriptorOrIndex?: TypedPropertyDescriptor<any> | number,
  ) {
    if (key || typeof descriptorOrIndex === 'number') {
      // Use repository or query-factory to create a query from model + dataSource
      inject('', meta, resolve)(target, key!, descriptorOrIndex);
      return;
    }
    // Mixin repository into the class
    throw new Error('Class level @query is not implemented');
  };
}

/**
 * Resolve the @query injection
 * @param ctx - Context
 * @param injection - Injection metadata
 */
async function resolve(ctx: Context, injection: Injection) {
  const meta = injection.metadata as QueryMetadata;

  if (meta.name) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const repo = (await ctx.get('repositories.' + meta.name)) as any;
    if (isQuery(repo.query)) {
      return repo.query;
    }
    return new DefaultQuery(repo);
  }

  let modelClass = meta.modelClass;
  if (meta.modelName) {
    modelClass = (await ctx.get('models.' + meta.modelName)) as typeof Entity;
  }
  if (!modelClass) {
    throw new Error('Invalid query config: neither modelClass nor modelName was specified.');
  }

  let dataSource = meta.dataSource;
  if (meta.dataSourceName) {
    dataSource = await ctx.get<DataSource>('datasources.' + meta.dataSourceName);
  }
  assert(dataSource instanceof juggler.DataSource, 'DataSource must be provided');

  return new DefaultQuery(modelClass, dataSource! as juggler.DataSource);
}
