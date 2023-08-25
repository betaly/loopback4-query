import {Constructor} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';

import {mixinQuery} from '../../../decorators';
import {QueryEnhancedRepository, QueryRepositoryMixin} from '../../../mixins';
import {Foo} from '../models/foo';

export class FooRepositoryWithQueryExtended extends QueryRepositoryMixin<
  Foo,
  typeof Foo.prototype.id,
  {},
  Constructor<DefaultCrudRepository<Foo, typeof Foo.prototype.id>>
>(DefaultCrudRepository) {
  constructor(dataSource: juggler.DataSource) {
    super(Foo, dataSource);
  }
}

@mixinQuery()
export class FooRepositoryWithQueryDecorated extends DefaultCrudRepository<Foo, typeof Foo.prototype.id> {
  constructor(dataSource: juggler.DataSource) {
    super(Foo, dataSource);
  }
}

export interface FooRepositoryWithQueryDecorated extends QueryEnhancedRepository<Foo> {}

@mixinQuery(true)
export class FooRepositoryWithQueryDecoratedFull extends DefaultCrudRepository<Foo, typeof Foo.prototype.id> {
  constructor(dataSource: juggler.DataSource) {
    super(Foo, dataSource);
  }
}

export interface FooRepositoryWithQueryDecoratedFull extends QueryEnhancedRepository<Foo> {}
