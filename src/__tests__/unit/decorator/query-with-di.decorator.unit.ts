import {Context, inject} from '@loopback/core';
import {DefaultCrudRepository, Entity, juggler, ModelDefinition} from '@loopback/repository';

import {query} from '../../../decorators/query.decorator';
import {DefaultQuery, Query} from '../../../query';

describe('query with di', () => {
  let ctx: Context;

  beforeAll(givenCtx);

  it('supports referencing predefined query by name via constructor', async () => {
    const myController = await ctx.get<StringBoundController>('controllers.StringBoundController');
    expect(myController.noteQuery).toBeInstanceOf(DefaultQuery);
  });

  it('supports referencing predefined query via constructor', async () => {
    const myController = await ctx.get<RepositoryBoundController>('controllers.RepositoryBoundController');
    expect(myController.noteQuery).toBeInstanceOf(DefaultQuery);
  });

  const ds: juggler.DataSource = new juggler.DataSource({
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

    title: string;
    content: string;

    constructor(data?: Partial<Note>) {
      super(data);
    }
  }

  class MyRepository extends DefaultCrudRepository<Entity, string> {
    constructor(@inject('models.Note') myModel: typeof Note, @inject('dataSources.db') dataSource: juggler.DataSource) {
      super(myModel, dataSource);
    }
  }

  class StringBoundController {
    constructor(@query('MyRepository') public noteQuery: Query<Entity>) {}
  }

  class RepositoryBoundController {
    constructor(@query(MyRepository) public noteQuery: Query<Entity>) {}
  }

  function givenCtx() {
    ctx = new Context();
    ctx.bind('models.Note').to(Note);
    ctx.bind('dataSources.db').to(ds);
    ctx.bind('repositories.MyRepository').toClass(MyRepository);
    ctx.bind('controllers.StringBoundController').toClass(StringBoundController);
    ctx.bind('controllers.RepositoryBoundController').toClass(RepositoryBoundController);
  }
});
