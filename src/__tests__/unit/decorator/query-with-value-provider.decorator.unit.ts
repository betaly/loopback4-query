import {Context, inject, Provider, ValueOrPromise} from '@loopback/core';
import {DefaultCrudRepository, Entity, juggler, ModelDefinition} from '@loopback/repository';

import {query} from '../../../decorators/query.decorator';
import {DefaultQuery, Query} from '../../../query';

describe('query with value provider', () => {
  let ctx: Context;

  beforeAll(function () {
    const ds = new juggler.DataSource({
      name: 'db',
      connector: 'sqlite3s',
      file: ':memory:',
    });

    class Note extends Entity {
      static definition = new ModelDefinition({
        name: 'note',
        properties: {
          title: 'string',
          content: 'string',
          id: {type: 'number', id: true},
        },
      });
    }

    ctx = new Context();
    ctx.bind('models.Note').to(Note);
    ctx.bind('dataSources.db').to(ds);
    ctx.bind('repositories.noteRepo').toProvider(MyRepositoryProvider);
    ctx.bind('controllers.MyController').toClass(MyController);
  });

  it('supports referencing predefined query by name via constructor', async () => {
    const myController = await ctx.get<MyController>('controllers.MyController');
    expect(myController.noteQuery).toBeInstanceOf(DefaultQuery);
  });
});

class MyController {
  constructor(@query('noteRepo') public noteQuery: Query<Entity>) {}
}

class MyRepositoryProvider implements Provider<DefaultCrudRepository<Entity, string>> {
  constructor(
    @inject('models.Note') private myModel: typeof Entity,
    @inject('dataSources.db') private dataSource: juggler.DataSource,
  ) {}

  value(): ValueOrPromise<DefaultCrudRepository<Entity, string>> {
    return new DefaultCrudRepository(this.myModel, this.dataSource as juggler.DataSource);
  }
}
