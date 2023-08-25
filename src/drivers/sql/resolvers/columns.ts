/* eslint-disable @typescript-eslint/no-floating-promises */
import {isFilter} from '@loopback/filter';
import {Entity} from '@loopback/repository';
import {Knex} from 'knex';
import isEmpty from 'tily/is/empty';
import isObject from 'tily/is/object';

import {QueryFilter} from '../../../filter';
import {ClauseResolver} from '../clause';

export class ColumnsResolver<TModel extends Entity> extends ClauseResolver<TModel> {
  resolve(qb: Knex.QueryBuilder<TModel>, filter?: QueryFilter<TModel>): void {
    const columns = this.buildColumnNames(isFilter(filter) ? filter.fields : filter, true);
    if (columns) {
      qb.columns(columns);
    }
  }

  buildColumnNames(fields?: string[] | Record<string, boolean | undefined>, withTable = false) {
    const props = this.entityClass.definition.properties;
    if (isEmpty(props)) {
      return;
    }
    let keys = Object.keys(props);

    if (fields && !isEmpty(fields)) {
      if (Array.isArray(fields)) {
        keys = fields.filter(f => props[f]);
      } else if (isObject(fields)) {
        const includes: string[] = [];
        const excludes: string[] = [];
        for (const key of keys) {
          if (fields[key]) {
            includes.push(key);
          } else if (key in fields && !fields[key]) {
            excludes.push(key);
          }
        }
        if (includes.length > 0) {
          keys = includes;
        } else if (excludes.length > 0) {
          keys = keys.filter(k => !excludes.includes(k));
        }
      }
    }

    return keys.map(key => this.columnEscaped(key, withTable));
  }
}
