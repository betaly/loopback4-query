/* eslint-disable @typescript-eslint/no-explicit-any */
import {Constructor} from '@loopback/core';
import {DefaultCrudRepository, juggler} from '@loopback/repository';

import {queryPatch, queryUnpatch} from '../../../patches';
import {DefaultQuery, QueryMethods} from '../../../query';
import {originalProp} from '../../../utils';
import {Foo} from '../../fixtures/models/foo';
import {DB, givenDb} from '../../support';

describe('patch/unpatch', () => {
  let db: DB;
  let memdb: DB;
  let FooRepository: Constructor<DefaultCrudRepository<any, any>>;

  const querySpies: Record<string, jest.SpyInstance> = {};
  const originalSpies: Record<string, jest.SpyInstance> = {};

  beforeAll(async () => {
    db = givenDb({connector: 'sqlite3s', file: ':memory:'});
    memdb = givenDb({connector: 'memory'});
    await db.ds.automigrate();
    await memdb.ds.automigrate();
  });

  beforeEach(() => {
    FooRepository = givenRepository();
    for (const method of QueryMethods) {
      querySpies[method] = jest.spyOn(DefaultQuery.prototype, method);
      originalSpies[method] = jest.spyOn(FooRepository.prototype, method);
    }
  });

  afterEach(() => {
    for (const method of QueryMethods) {
      querySpies[method].mockRestore();
      originalSpies[method].mockRestore();
    }
  });

  describe('patch', function () {
    it('should patch a Repository class', () => {
      const proto = FooRepository.prototype;
      assertNotPatched(proto);
      const result = queryPatch(FooRepository);
      expect(result).toBe(true);
      assertPatched(proto);
    });

    it('should patch a Repository instance', () => {
      const repo = new FooRepository(db.ds);
      assertNotPatched(repo);
      const result = queryPatch(repo);
      expect(result).toBe(true);
      assertPatched(repo);
    });

    it('should skip if has been patched', () => {
      const result = queryPatch(FooRepository);
      expect(result).toBe(true);
      const result2 = queryPatch(FooRepository);
      expect(result2).toBeNull();
    });

    it('should return false for null target', () => {
      const result = queryPatch(null as any);
      expect(result).toBe(false);
    });

    it('should return false for non-Repository target', () => {
      const target = {};
      const result = queryPatch(target as any);
      expect(result).toBe(false);
      assertNotPatched(target);
    });

    describe('query with Query', () => {
      for (const method of QueryMethods) {
        it(`should query with Query "${method}"`, async () => {
          const result = queryPatch(FooRepository);
          expect(result).toBe(true);
          const repo = new FooRepository(db.ds) as any;
          await repo[method]();
          expect(querySpies[method]).toHaveBeenCalledTimes(1);
          expect(originalSpies[method]).not.toHaveBeenCalled();
        });
      }
    });

    describe('query with original', () => {
      for (const method of QueryMethods) {
        it(`should query with original "${method}"`, async () => {
          const result = queryPatch(FooRepository);
          expect(result).toBe(true);
          const repo = new FooRepository(memdb.ds) as any;
          await repo[method]();
          expect(querySpies[method]).not.toHaveBeenCalled();
          expect(originalSpies[method]).toHaveBeenCalledTimes(1);
        });
      }
    });

    describe('patch DefaultCurdRepository', () => {
      let findSpy: jest.SpyInstance;

      beforeEach(() => {
        findSpy = jest.spyOn(DefaultQuery.prototype, 'find');
      });

      afterEach(() => {
        findSpy.mockRestore();
        queryUnpatch(DefaultCrudRepository);
      });

      it('should patch DefaultCrudRepository', () => {
        assertNotPatched(DefaultCrudRepository.prototype);
        assertNotPatched(FooRepository.prototype);
        const result = queryPatch(DefaultCrudRepository);
        expect(result).toBe(true);
        assertPatched(DefaultCrudRepository.prototype);
        assertPatched(FooRepository.prototype);
        queryUnpatch(DefaultCrudRepository);
        assertNotPatched(DefaultCrudRepository.prototype);
        assertNotPatched(FooRepository.prototype);
      });

      it('should not be affected if base class has been patched after sub class definition', async () => {
        let repo = new FooRepository(db.ds);
        await repo.find();
        expect(findSpy).not.toHaveBeenCalled();

        queryPatch(DefaultCrudRepository);

        repo = new FooRepository(db.ds);
        await repo.find();
        expect(findSpy).not.toHaveBeenCalled();
      });

      it('should query with Query if base class has been patched before sub class definition', async () => {
        queryPatch(DefaultCrudRepository);
        const NewFooRepository = givenRepository();
        const repo = new NewFooRepository(db.ds);
        await repo.find();
        expect(findSpy).toHaveBeenCalled();
      });
    });
  });

  describe('unpatch', function () {
    it('should unpatch a Repository class', () => {
      const proto = FooRepository.prototype;
      queryPatch(FooRepository);
      assertPatched(proto);
      queryUnpatch(FooRepository);
      assertNotPatched(proto);
    });

    it('should unpatch a Repository instance', () => {
      const repo = new FooRepository(db.ds);
      queryPatch(repo);
      assertPatched(repo);
      queryUnpatch(repo);
      assertNotPatched(repo);
    });
  });
});

function givenRepository(): Constructor<DefaultCrudRepository<any, any>> {
  class FooRepository extends DefaultCrudRepository<Foo, number> {
    constructor(dataSource: juggler.DataSource) {
      super(Foo, dataSource);
    }
  }

  return FooRepository;
}

function assertNotPatched(target: any) {
  expect(target.__getQuery__).not.toBeDefined();
  for (const method of QueryMethods) {
    expect(target[originalProp(method)]).not.toBeDefined();
  }
}

function assertPatched(target: any) {
  expect(target.__getQuery__).toBeDefined();
  for (const method of QueryMethods) {
    expect(target[originalProp(method)]).toBeDefined();
  }
}
