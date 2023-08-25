# loopback4-query

> An enhanced query for loopback-next, which supports cascading queries through relational conditions.

## Features

- Support cascading filter queries (through `where` clauses such as
  `{where: {'relation_ab.relation_bc.relation_cd.property': 'value'}}`)
- Fully compatible with loopback-next's Where Filter
- Support [hasMany](https://loopback.io/doc/en/lb4/HasMany-relation.html),
  [belongsTo](https://loopback.io/doc/en/lb4/BelongsTo-relation.html),
  [hasOne](https://loopback.io/doc/en/lb4/HasOne-relation.html) and
  [hasManyThrough](https://loopback.io/doc/en/lb4/HasManyThrough-relation.html) Relation
- Support [Polymorphic Relation](https://loopback.io/doc/en/lb4/Polymorphic-relation.html)
- Support `PostgreSQL`, `MSSQL`, `MySQL`, `MariaDB`, `SQLite3`, `Oracle` relational databases, other databases, extended
  by Mixin The Repository will delegate to the parent's native query method.
- [access](https://loopback.io/doc/en/lb3/Operation-hooks.html#access) and `findOne` loading objects are not supported
  [loaded](https://loopback.io/doc/en/lb3/Operation-hooks.html#access) event.

## Install

npm:

```shell
npm install loopback4-query
```

Yarn:

```shell
yarn add loopback4-query
```

## Getting Started

```ts
import {DefaultQuery, Query} from 'loopback4-query';

import {typequery} from './decorators';

class SomeClass {
  query: Query<SomeEntity>;

  constructor(
    @repository(OrgRepository)
    public orgRepository: OrgRepository,
  ) {
    this.query = new DefaultQuery(this.orgRepository);
  }

  async findSomeEntity() {
    return this.query.find({
      where: {
        // Through the name condition of projects, cascade query Org. But the result does not contain the associated object projects. To include associated objects, use the include method.
        'projects.name': 'bleco',
        age: {
          gt: 10,
          lt: 20,
        },
      },
      include: [
        // Contains the associated object projects
        {
          relation: 'projects',
          scope: {
            where: {
              name: 'bleco',
            },
          },
        },
      ],
    });
  }
}
```

## DefaultQuery

A query that performs model filtering queries through relational cascading conditions.

### Usage

#### Construct

Construct DefaultQuery with a Repository instance parameter, support include clause with
[repository inclusion resolvers](https://loopback.io/doc/en/lb4/Relations.html)

```ts
new DefaultQuery(repository);
```

Construct DefaultQuery with a model class and a datasource instance parameters, include is not supported clause

```ts
new DefaultQuery(entityClass, datasource);
```

#### `QueryRepositoryMixin` inheritance

Extends native `find` and `findOne` support for seamless cascading queries by mixing in Repository with
`QueryRepositoryMixin`. (Note: `find` is not supported and `findOne`'s
[access](https://loopback.io/doc/en/lb3/Operation-hooks.html#access) and
[loaded](https://loopback.io/doc/en/lb3/Operation-hooks.html#access) event)

method:

```ts
declare function QueryRepositoryMixin<
  M extends Entity,
  ID,
  Relations extends object,
  R extends MixinTarget<EntityCrudRepository<M, ID, Relations>>,
>(superClass: R, options: boolean | QueryMixinOptions = {});
```

parameter:

- `superClass`: the inherited class
- `options: boolean | QueryMixinOptions`: mixin options
  - `overrideCruds`: whether to override native CRUD methods, the default is `false`

```ts
export class FooRepository
  extends QueryRepositoryMixin<
    Foo,
    typeof Foo.prototype.id,
    FooRelations,
    Constructor<DefaultCrudRepository<Foo, typeof Foo.prototype.id, FooRelations>>
  >(DefaultCrudRepository, {overrideCruds: true})
  implements DefaultCrudRepository<Foo, typeof Foo.prototype.id, FooRelations>
{
  constructor(dataSource: juggler.DataSource) {
    super(Foo, dataSource);
  }
}
```

#### `@mixinQuery` decorator

Syntax:

`@mixinQuery(options: boolean | QueryMixinOptions = false)`

parameter:

- `options: boolean | QueryMixinOptions`: mixin options
  - `overrideCruds`: whether to override native CRUD methods, the default is `false`

```ts
@mixinQuery(true)
export class FooRepositoryWithQueryDecorated extends DefaultCrudRepository<Foo, typeof Foo.prototype.id> {
  constructor(dataSource: juggler.DataSource) {
    super(Foo, dataSource);
  }
}

export interface FooRepositoryWithQueryDecorated extends QueryRepository<Foo> {}
```

#### `@query` decorator

Syntax:

`@query(modelOrRepo: string | Class<Repository<Model>> | typeof Entity, dataSource?: string | juggler.DataSource)`

The `@query` decorator creates a new `query` instance by injecting an existing `repository` instance, or from a `model`
and `datasource`.

Create a `query` instance in a `controller`, you can first define `model` and `datasource`, then import into
`controller`, and use `@query` to inject

```ts
import {Query, query} from 'loopback4-query';
import {repository} from '@loopback/repository';

import {db} from '../datasources/db.datasource';
import {Todo} from '../models';

export class TodoController {
  @query(Todo, db)
  todoQuery: Query<Todo>;
  // ...
}
```

If `model` or `datasource` are already bound to `app`, they can be created by passing their names directly to the
`@query` injector, as follows:

```ts
// with `db` and `Todo` already defined.
app.bind('datasources.db').to(db);
app.bind('models.Todo').to(Todo);

export class TodoController {
  @query('Todo', 'db')
  todoQuery: Query<Todo>;
  //etc
}
```

#### `QueryEnhancedCrudRepository` inherits from `DefaultCrudRepository` and implements `mixinQuery`

`DefaultCrudRepository` is the default CRUD interface implementation of `loopback`, which has all the functions of the
CRUD interface. Most business repositories inherit from it.

Here we provide a class that inherits from `DefaultCrudRepository` and replaces `QueryEnhancedCrudRepository` of
`mixinQuery` with `Query` replaces `find`, `findOne` and `count` native queries. For data sources that are not yet
supported (such as non-relational databases), they will be passed directly to the native query.

#### Patching

For historical projects, it is not convenient to use Mixin or inheritance for refactoring. Therefore, we provide a
Patching scheme that can be initialized in the application, not yet `patching` the `DefaultCrudRepository` before
loading.

```ts
import {queryPatch} from 'loopback4-query';
import {DefaultCrudRepository} from '@loopback/repository';

export async function main(options: ApplicationConfig = {}) {
  // patching `DefaultCrudRepository`
  queryPatch(DefaultCrudRepository);

  const app = new TodoListApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  return app;
}
```

##### `queryPatch(repoClass)`: Patching a `Repository` class or instance

```ts
// patching a repository class
queryPatch(DefaultCrudRepository);

// patching a repository instance
queryPatch(repository);

// or patching self
class MyRepository extends DefaultCrudRepository<MyModel, typeof MyModel.prototype.id> {
  constructor(dataSource: juggler.DataSource) {
    super(MyModel, dataSource);
    queryPatch(this);
  }
}
```

#### Query API

```ts
export interface Query<T extends Entity, Relations extends object = {}> {
  entityClass: EntityClass<T>;

  /**
   * Find matching records
   *
   * @param filter - Query filter
   * @param options - Options for the operations
   * @returns A promise of an array of records found
   */
  find(filter?: QueryFilter<T>, options?: Options): Promise<(T & Relations)[]>;

  /**
   * Find one record that matches filter specification. Same as find, but limited to one result; Returns object, not collection.
   *
   * @param filter - Query filter
   * @param options - Options for the operations
   * @returns A promise of a record found
   */
  findOne(filter?: QueryFilter<T>, options?: Options): Promise<(T & Relations) | null>;

  /**
   * Count matching records
   * @param where - Matching criteria
   * @param options - Options for the operations
   * @returns A promise of number of records matched
   */
  count(where?: QueryWhere<T>, options?: Options): Promise<{count: number}>;
}
```

#### QueryFilter

Compatible with loopback native [Filter](https://loopback.io/doc/en/lb4/Querying-data.html#filters). Extended support
for cascading paths as `where` children query condition.

- query with `LEFT JOIN`

  ```json5
  {
    where: {
      'relation_a.relation_b.property': 'some value',
    },
  }
  ```

- query with `LEFT JOIN` like `INNER JOIN`

  ```json5
  {
    where: {
      'relation_a.relation_b.id': {neq: null},
    },
  }
  ```

- Use `$join` for relational queries (using `LEFT JOIN`)

  ```json5
  {
    where: {
      $join: 'relation_a.relation_b',
    },
  }
  ```

  Or define multiple relationships at the same time

  ```json5
  {
    where: {
      $join: ['relation_a.relation_b', 'relation_c.relation_d'],
    },
  }
  ```

- Use `$expr` for filtering queries between fields 
  - value <-> value:

  ```json5
  {
    where: {
      $expr: {
        eq: [1, 0],
      },
    },
  }
  ```

  - Field <-> Value:
    ```json5
    {
      where: {
        $expr: {
          eq: ['$joination_a.relation_b.property', 'some value'],
        },
      },
    }
    ```
  - Value <-> fields:
    ```json5
    {
      where: {
        $expr: {
          eq: ['some value', '$joination_a.relation_b.property'],
        },
      },
    }
    ```
  - field <-> field:
    ```json5
    {
      where: {
        $expr: {
          eq: ['$joination_a.relation_b.property', '$joination_c.relation_d.property'],
        },
      },
    }
    ```

- Polymorphic Relations Query. For details, please refer to the relevant [Test Case](src/__tests__/unit/query.unit.ts).
  ```json5
  {
    where: {
      'deliverables(Letter).property': 'some value',
    },
  }
  ```

For example, there are the following models:

```ts
// user.model.ts
@model()
export class User extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
  })
  email?: string;

  @hasMany(() => Org, {through: {model: () => OrgUser}})
  orgs: Org[];

  constructor(data?: Partial<User>) {
    super(data);
  }
}
```

```ts
// org.model.ts
@model()
export class Org extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
  })
  name: string;

  @hasMany(() => User, {through: {model: () => OrgUser}})
  users: User[];

  @hasMany(() => Proj, {keyTo: 'org_id'})
  projs: Proj[];

  constructor(data?: Partial<Org>) {
    super(data);
  }
}
```

```ts
// proj.model.ts
@model()
export class Proj extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'string',
  })
  name: string;

  @property({
    type: 'string',
  })
  title?: string;

  @belongsTo(() => Org, {name: 'org'})
  org_id?: number;

  constructor(data?: Partial<Proj>) {
    super(data);
  }
}
```

- Find all `users` that have access to `organizations` with `bleco` in their name:

```ts
const userQuery = new DefaultQuery(userRepository);

const users = await userQuery.find({
  where: {
    'orgs.name': {
      like: '%bleco%',
    },
  },
});
```

- Find all `users` that have access to `projects` with `bleco` in their name:

```ts
const userQuery = new DefaultQuery(userRepository);

const users = await userQuery.find({
  where: {
    'orgs.projs.title': {
      like: '%bleco%',
    },
  },
});
```

## Thanks

- [knex-filter-loopback](https://github.com/joostvunderink/knex-filter-loopback): Declarative filtering for `knex.js`
  based on the Loopback Where Filter.
- [loopback-connector-postgresql](https://github.com/Wikodit/loopback-connector-postgresql): supports LEFT JOIN only
  across one postgres datasource
- [loopback-connector-postgresql-include](https://github.com/Denys8/loopback-connector-postgresql-include): Resolving
  [Include filter](https://loopback.io/doc/en/lb4/Include-filter.html) with `left join`

## License

[MIT](LICENSE)
