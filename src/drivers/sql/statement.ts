import {Entity} from '@loopback/repository';
import {Knex} from 'knex';

import {QueryFilter} from '../../filter';
import {Orm} from '../../orm';
import {QuerySession} from '../../session';
import {EntityClass} from '../../types';
import {ColumnsResolver, JoinResolver, OrderResolver, WhereResolver} from './resolvers';

export class StatementResolver<T extends Entity = Entity> {
  readonly columns: ColumnsResolver<T>;
  readonly join: JoinResolver<T>;
  readonly where: WhereResolver<T>;
  readonly order: OrderResolver<T>;

  constructor(public readonly model: EntityClass<T>, public orm: Orm) {
    this.columns = new ColumnsResolver(model, this.orm);
    this.join = new JoinResolver(model, this.orm);
    this.where = new WhereResolver(model, this.orm);
    this.order = new OrderResolver(model, this.orm);
  }

  resolveColumns(qb: Knex.QueryBuilder, filter: QueryFilter<T>) {
    this.columns.resolve(qb, filter);
  }

  resolveJoin(qb: Knex.QueryBuilder, filter: QueryFilter<T>, session: QuerySession) {
    this.join.resolve(qb, filter, session);
  }

  resolveWhere(qb: Knex.QueryBuilder, filter: QueryFilter<T>, session: QuerySession) {
    this.where.resolve(qb, filter, session);
  }

  resolveOrder(qb: Knex.QueryBuilder, filter: QueryFilter<T>, session: QuerySession) {
    this.order.resolve(qb, filter, session);
  }
}

export class StatementResolvers {
  protected items: Map<string, StatementResolver> = new Map();

  constructor(public orm: Orm) {}

  get<T extends Entity = Entity>(model: EntityClass<T>): StatementResolver<T> {
    let answer = this.items.get(model.modelName);
    if (!answer) {
      answer = new StatementResolver(model, this.orm) as StatementResolver;
      this.items.set(model.modelName, answer);
    }
    return answer as StatementResolver<T>;
  }
}
