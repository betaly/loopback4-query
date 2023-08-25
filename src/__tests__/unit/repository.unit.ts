import {juggler} from '@loopback/repository';

import {DefaultQuery} from '../../query';
import {QueryEnhancedCrudRepository} from '../../repository';
import {Foo} from '../fixtures/models/foo';
import {DB, givenDb} from '../support';

describe('QueryEnhancedCrudRepository', function () {
  let db: DB;
  let findSpy: jest.SpyInstance;

  class MyRepository extends QueryEnhancedCrudRepository<Foo, typeof Foo.prototype.id> {
    constructor(dataSource: juggler.DataSource) {
      super(Foo, dataSource);
    }
  }

  beforeAll(async () => {
    db = givenDb({connector: 'sqlite3s', file: ':memory:'});
    await db.ds.automigrate();
  });

  beforeEach(() => {
    findSpy = jest.spyOn(DefaultQuery.prototype, 'find');
  });

  afterEach(() => {
    findSpy.mockRestore();
  });

  it('should mixin QueryRepository', function () {
    const myRepository = new MyRepository(db.ds);
    expect(myRepository.query).toBeInstanceOf(DefaultQuery);
  });

  it('should query with Query', async () => {
    const myRepository = new MyRepository(db.ds);
    await myRepository.find({where: {id: 1}});
    expect(findSpy).toHaveBeenCalledTimes(1);
  });
});
