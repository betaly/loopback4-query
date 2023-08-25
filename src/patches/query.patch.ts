/* eslint-disable @typescript-eslint/no-explicit-any */
import {Constructor, Entity, EntityCrudRepository} from '@loopback/repository';
import {isConstructor} from 'tily/is/constructor';
import {isFunction} from 'tily/is/function';

import {DefaultQuery, QueryMethods} from '../query';
import {originalProp} from '../utils';

const debug = require('debug')('bleco:query:patch');

export type PatchResult = boolean | null;

export function queryUnpatch(
  repo: Constructor<EntityCrudRepository<Entity, unknown>> | EntityCrudRepository<Entity, unknown>,
) {
  const target = isConstructor(repo) ? repo.prototype : repo;
  if (target.__getQuery__) {
    delete target.__getQuery__;
    if (target.__query__) {
      delete target.__query__;
    }
    for (const method of QueryMethods) {
      if (target[originalProp(method)]) {
        target[method] = target[originalProp(method)];
        delete target[originalProp(method)];
      }
    }
  }
}

export function queryPatch(
  repo: Constructor<EntityCrudRepository<Entity, unknown>> | EntityCrudRepository<Entity, unknown>,
): PatchResult {
  const target = isConstructor(repo) ? repo.prototype : repo;

  if (!target || !isFunction(target.find)) {
    return false;
  }

  if (!target.__getQuery__) {
    target.__getQuery__ = function () {
      if (this.__query__ === undefined && (this as any).dataSource) {
        try {
          this.__query__ = new DefaultQuery<Entity>(this);
        } catch (e) {
          this.__query__ = null;
        }
      }
      return this.__query__;
    };

    for (const method of QueryMethods) {
      if (target[method] && !target[originalProp(method)]) {
        target[originalProp(method)] = target[method];
        target[method] = function (...args: any[]) {
          const query = this.__getQuery__();
          if (query) {
            debug(`${this.constructor.name} ${method}() -> query.${method}()`);
            return query[method](...args);
          }
          debug(`${this.constructor.name} ${method}() -> super.${method}()`);
          return this[originalProp(method)](...args);
        };
      }
    }
    return true;
  }

  return null;
}
