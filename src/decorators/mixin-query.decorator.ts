/* eslint-disable @typescript-eslint/no-explicit-any */
import {MixinTarget} from '@loopback/core';
import {EntityCrudRepository} from '@loopback/repository';

import {QueryMixinOptions, QueryRepositoryMixin} from '../mixins';

/**
 * A decorator to mixin Query to a EntityCrudRepository
 */
export function mixinQuery(options: boolean | QueryMixinOptions = false) {
  return function <T extends MixinTarget<EntityCrudRepository<any, any>>>(superClass: T) {
    return QueryRepositoryMixin(superClass, options);
  };
}
