/* eslint-disable @typescript-eslint/no-explicit-any */
import {Constructor} from '@loopback/core';
import {Entity, EntityCrudRepository} from '@loopback/repository';

import {QueryEnhancedRepository} from '../../mixins';
import {DefaultQuery} from '../../query';
import {Foo} from '../fixtures/models/foo';
import {
  FooRepositoryWithQueryDecorated,
  FooRepositoryWithQueryDecoratedFull,
  FooRepositoryWithQueryExtended,
} from '../fixtures/repositories/foo.repository';
import {seed} from '../fixtures/seed';
import {DB, givenDb} from '../support';

type ModelRepository<T extends Entity> = EntityCrudRepository<T, unknown> & QueryEnhancedRepository<T>;
type ModelRepositoryCtor<T extends Entity> = Constructor<ModelRepository<T>>;

const MixinSpecs: [string, ModelRepositoryCtor<Foo>][] = [
  ['extends', FooRepositoryWithQueryExtended],
  ['decorator', FooRepositoryWithQueryDecoratedFull],
];

describe('Query Mixin Integration Tests', () => {
  let db: DB;

  let findSpy: jest.SpyInstance;
  let findOneSpy: jest.SpyInstance;
  let countSpy: jest.SpyInstance;

  beforeAll(async () => {
    db = givenDb();
    await db.ds.automigrate();
    await seed(db.repos);
  });

  describe('mixin without "overrideCruds"', () => {
    let repo: FooRepositoryWithQueryDecorated;

    beforeAll(() => {
      repo = new FooRepositoryWithQueryDecorated(db.ds);
      findSpy = jest.spyOn(repo.query!, 'find');
      findOneSpy = jest.spyOn(repo.query!, 'findOne');
      countSpy = jest.spyOn(repo.query!, 'count');
    });

    afterAll(async () => {
      findSpy.mockRestore();
      countSpy.mockRestore();
    });

    afterEach(async () => {
      findSpy.mockClear();
      countSpy.mockClear();
    });

    it('should not override original cruds', async () => {
      const filter = {where: {name: {like: '%Foo%'}}};
      await repo.find(filter);
      expect(findSpy).not.toHaveBeenCalled();
      await (repo as any).findOne(filter);
      expect(findOneSpy).not.toHaveBeenCalled();
      await repo.count(filter.where);
      expect(countSpy).not.toHaveBeenCalled();
    });
  });

  for (const [name, Repo] of MixinSpecs) {
    describe(`mixin with ${name}`, () => {
      let repo: ModelRepository<Foo>;

      beforeAll(() => {
        repo = new Repo(db.ds);
        findSpy = jest.spyOn(repo.query!, 'find');
        findOneSpy = jest.spyOn(repo.query!, 'findOne');
        countSpy = jest.spyOn(repo.query!, 'count');
      });

      afterAll(async () => {
        findSpy.mockRestore();
        countSpy.mockRestore();
      });

      afterEach(async () => {
        findSpy.mockClear();
        countSpy.mockClear();
      });

      it('should initiate Query mixed repository', async () => {
        expect(repo.query).toBeInstanceOf(DefaultQuery);
      });

      it('find with Query.find method', async () => {
        const filter = {where: {name: {like: '%Foo%'}}};
        await repo.find(filter);
        expect(findSpy).toHaveBeenCalledWith(filter, undefined);
      });

      it('findOne with Query.findOne method', async () => {
        const filter = {where: {name: {like: '%Foo%'}}};
        expect('findOne' in repo).toBe(true);
        await (repo as any).findOne(filter);
        expect(findOneSpy).toHaveBeenCalledWith(filter, undefined);
      });

      it('count with Query.count method', async () => {
        const where = {name: {like: '%Foo%'}};
        await repo.count(where);
        expect(countSpy).toHaveBeenCalledWith(where, undefined);
      });
    });
  }
});
