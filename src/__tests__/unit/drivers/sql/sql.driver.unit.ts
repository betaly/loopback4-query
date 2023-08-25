import {Driver} from '../../../../driver';
import {SqlDriver} from '../../../../drivers';
import {Org} from '../../../fixtures/models/org';
import {Proj} from '../../../fixtures/models/proj';
import {User} from '../../../fixtures/models/user';
import {seed} from '../../../fixtures/seed';
import {DB, givenDb, mockPg, Repos} from '../../../support';

mockPg();

describe('SqlDriver', () => {
  let db: DB;
  let repos: Repos;

  let driver: Driver;

  beforeAll(async () => {
    db = givenDb({connector: 'sqlite3s', file: ':memory:'});
    repos = db.repos;
    driver = new SqlDriver(db.ds);

    await db.ds.automigrate();
    await seed(repos);
  });

  describe('count', () => {
    it('count without relations', async () => {
      const {count} = await driver.count(User);
      expect(count).toEqual(4);
    });

    it('count without relation only', async () => {
      const {count} = await driver.count(User, {'userInfo.id': {neq: null}});
      expect(count).toEqual(3);
    });

    it('should count with hasOne', async () => {
      const {count} = await driver.count(User, {'userInfo.info': {like: `%user1%`}});
      expect(count).toEqual(1);
    });

    it('should count with hasMany', async () => {
      const {count} = await driver.count(Org, {'projs.name': {like: `%OrgA%`}});
      expect(count).toEqual(1);
    });

    it('should count with hasMany through', async () => {
      const {count} = await driver.count(Org, {'users.email': 'user1@example.com'});
      expect(count).toEqual(2);
    });

    it('should count with belongsTo', async () => {
      const {count} = await driver.count(Proj, {'org.name': {like: `%OrgA%`}});
      expect(count).toEqual(2);
    });

    it('should count with deep relations', async () => {
      const {count} = await driver.count(Org, {'projs.issues.creator.email': 'user1@example.com'});
      expect(count).toEqual(2);
    });

    it('should count with multiple relations', async () => {
      const {count} = await driver.count(Org, {
        and: [{'projs.issues.creator.email': 'user1@example.com'}, {'projs.name': {like: `%OrgA%`}}],
      });
      expect(count).toEqual(1);
    });
  });

  describe('find', () => {
    it('should find without relations', async () => {
      const result = await driver.find(User);
      expect(result).toHaveLength(4);
    });

    it('should find with hasOne', async () => {
      const result = await driver.find(User, {where: {'userInfo.info': {like: `%user1%`}}});
      expect(result).toHaveLength(1);
      expect(result[0].email).toContain('user1');
    });

    it('should find with hasMany', async () => {
      const result = await driver.find(Org, {where: {'projs.name': {like: `%OrgA%`}}});
      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('OrgA');
    });

    it('should find with hasMany through', async () => {
      const result = await driver.find(Org, {where: {'users.email': 'user1@example.com'}});
      expect(result).toHaveLength(2);
    });

    it('should find with belongsTo', async () => {
      const result = await driver.find(Proj, {where: {'org.name': {like: `%OrgA%`}}});
      expect(result).toHaveLength(2);
      for (const item of result) {
        expect(item.name).toContain('OrgA');
      }
    });

    it('should find with deep relations', async () => {
      const result = await driver.find(Org, {where: {'projs.issues.creator.email': 'user1@example.com'}});
      expect(result).toHaveLength(2);
    });

    it('should find with multiple relations', async () => {
      const result = await driver.find(Org, {
        where: {
          and: [{'projs.issues.creator.email': 'user1@example.com'}, {'projs.name': {like: `%OrgA%`}}],
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toEqual('OrgA');
    });
  });
});
