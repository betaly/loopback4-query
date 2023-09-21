/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-explicit-any */
import {Filter} from '@loopback/filter';
import {AnyObject, Entity, Options} from '@loopback/repository';
import {Knex} from 'knex';

import {Driver} from '../../driver';
import {QueryFilter, QueryWhere} from '../../filter';
import {QuerySession} from '../../session';
import {EntityClass} from '../../types';
import {createKnex} from './knex';
import {StatementResolvers} from './statement';

const debug = require('debug')('bleco:query:driver:sql');

export class SqlDriver extends Driver {
  protected knex: Knex;
  protected resolvers: StatementResolvers;

  async find<T extends Entity>(
    model: EntityClass<T>,
    filter?: QueryFilter<T>,
    options?: Options,
  ): Promise<AnyObject[]> {
    const resolver = this.resolvers.get(model);
    filter = filter ?? {};
    this.applySortPolicy(model, filter);
    const [qb] = this.buildSelect(model, filter);
    resolver.resolveColumns(qb, filter);
    const s = qb.toSQL().toNative();
    if (debug.enabled) {
      debug(`Find with SQL: %s`, s.sql);
      debug(`Parameters: %o`, s.bindings);
    }
    const rows: Record<string, any>[] = await this.orm.execute(s.sql, s.bindings, options);
    return rows.map(row => this.orm.fromRow(model.modelName, row));
  }

  async count<T extends Entity>(
    model: EntityClass<T>,
    where?: QueryWhere<T>,
    options?: Options,
  ): Promise<{count: number}> {
    const [qb, session] = this.buildSelect(model, {where});
    const builder = session.hasRelationJoins() ? this.knex(qb) : qb;
    builder.count('*', {as: 'cnt'});
    const s = builder.toSQL().toNative();
    if (debug.enabled) {
      debug(`Count with SQL: %s`, s.sql);
      debug(`Parameters: %o`, s.bindings);
    }
    const data = await this.orm.execute(s.sql, s.bindings, options);
    if (debug.enabled) {
      debug(`Count result: %o`, data);
    }
    return {count: data[0]?.cnt ?? 0};
  }

  protected init() {
    this.knex = createKnex(this.dataSource, this.options);
    this.resolvers = new StatementResolvers(this.orm);
  }

  protected buildSelect<T extends Entity = Entity>(
    model: EntityClass<T>,
    filter: QueryFilter<T>,
  ): [Knex.QueryBuilder, QuerySession] {
    const transformer = this.resolvers.get(model);
    const session = QuerySession.create();
    const qb = this.knex(this.orm.tableEscaped(model.modelName)).queryContext({skipEscape: true});
    transformer.resolveJoin(qb, filter, session);
    transformer.resolveWhere(qb, filter, session);
    transformer.resolveOrder(qb, filter, session);
    this.resolveLimit(qb, filter);

    if (session.hasRelationJoins()) {
      // groupBy ids to avoid duplication for joins
      qb.groupBy(this.orm.idNames(model.modelName).map(id => this.orm.columnEscaped(model.modelName, id, true)));
    }
    return [qb, session];
  }

  protected resolveLimit(qb: Knex.QueryBuilder, filter: Filter) {
    let limit = filter.limit;
    let offset = filter.skip ?? filter.offset;

    if (isNaN(limit ?? 0)) {
      limit = 0;
    }
    if (isNaN(offset ?? 0)) {
      offset = 0;
    }
    if (!limit && !offset) {
      return;
    }

    if (limit) {
      qb.limit(limit);
    }
    if (offset) {
      qb.offset(offset);
    }
  }
}
