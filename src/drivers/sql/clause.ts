import {Filter} from '@loopback/filter';
import {Entity, juggler} from '@loopback/repository';
import {Knex} from 'knex';

import {DefaultOrm, Orm} from '../../orm';
import {QuerySession} from '../../session';
import {EntityClass} from '../../types';
import {isMapper} from '../../utils';

export class ClauseResolver<TModel extends Entity> {
  public readonly orm: Orm;

  constructor(public entityClass: EntityClass<TModel>, orm: Orm | juggler.DataSource) {
    this.orm = isMapper(orm) ? orm : new DefaultOrm(orm);
  }

  resolve(qb: Knex.QueryBuilder<TModel>, filter: Filter<TModel>, session: QuerySession) {
    throw new Error('Not implemented');
  }

  tableEscaped() {
    return this.orm.tableEscaped(this.entityClass.modelName);
  }

  columnEscaped(columnName: string, withTable?: boolean, prefix?: string) {
    return this.orm.columnEscaped(this.entityClass.modelName, columnName, withTable, prefix);
  }
}
