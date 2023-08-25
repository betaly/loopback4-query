import {AnyObject, Entity, Filter, juggler, Options} from '@loopback/repository';
import debugFactory from 'debug';

import {QueryFilter, QueryWhere} from './filter';
import {DefaultOrm, Orm} from './orm';
import {EntityClass, IdSort} from './types';

const debug = debugFactory('bleco:query:driver');

export abstract class Driver {
  protected orm: Orm;

  constructor(public readonly dataSource: juggler.DataSource, public options: Options = {}) {
    this.orm = new DefaultOrm(dataSource);
    this.init();
  }

  abstract find<T extends Entity>(
    model: EntityClass<T>,
    filter?: QueryFilter<T>,
    options?: Options,
  ): Promise<AnyObject[]>;

  abstract count<T extends Entity>(
    model: EntityClass<T>,
    where?: QueryWhere<T>,
    options?: Options,
  ): Promise<{count: number}>;

  protected init() {
    // do nothing
  }

  protected applySortPolicy(model: EntityClass, filter: Filter) {
    const sortPolicy = this.getDefaultIdSortPolicy(model);
    const sortById = (() => {
      switch (sortPolicy) {
        case 'numericIdOnly':
          return this.hasOnlyNumericIds(model);
        case false:
          return false;
        default:
          return true;
      }
    })();

    debug(model.modelName, 'sort policy:', sortPolicy, sortById);

    if (sortById && !filter.order) {
      const idNames = this.orm.idNames(model.modelName);
      if (idNames?.length) {
        filter.order = idNames;
      }
    }
  }

  protected getDefaultIdSortPolicy(model: EntityClass): IdSort {
    const definition = model.definition;
    if (Object.hasOwn(definition.settings, 'defaultIdSort')) {
      return definition.settings.defaultIdSort;
    }

    return true;
  }

  protected hasOnlyNumericIds(model: EntityClass) {
    const cols = model.definition.properties;
    const idNames = this.orm.idNames(model.modelName);
    const numericIds = idNames.filter(idName => cols[idName].type === Number);
    return numericIds.length === idNames.length;
  }
}
