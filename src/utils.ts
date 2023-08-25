import {juggler} from '@loopback/repository';
import isArray from 'tily/is/array';
import isEmpty from 'tily/is/empty';
import isString from 'tily/is/string';
import each from 'tily/object/each';

import {Orm, SqlConnector} from './orm';

export function omit<T extends object = object>(obj: T, fn: (value: unknown) => boolean): Partial<T> {
  const result: Partial<T> = {};
  each((v, k) => {
    if (!fn(v)) {
      result[k] = v;
    }
  }, obj);
  return result;
}

export function compactWhere(where: object) {
  return omit(where, v => v === undefined || ((isArray(v) || isString(v)) && isEmpty(v)));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isDataSource(x: any): x is juggler.DataSource {
  return x && typeof x === 'object' && typeof x.connect === 'function' && typeof x.discoverSchemas === 'function';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isSqlConnector(x: any): x is SqlConnector {
  return (
    x &&
    typeof x === 'object' &&
    typeof x.tableEscaped === 'function' &&
    typeof x.columnEscaped === 'function' &&
    typeof x.autoupdate === 'function'
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isMapper(x: any): x is Orm {
  return x && typeof x.column === 'function' && typeof x.table === 'function' && !isDataSource(x) && !isSqlConnector(x);
}

/**
 * Check if a value is attempting to use nested json keys
 * @param {String} key The property being queried from where clause
 * @returns {Boolean} True of the property contains dots for nested json
 */
export function isNested(key: string) {
  return key.split('.').length > 1;
}

export const originalProp = (method: string) => `__${method}__`;
