import * as knex from '../../drivers/sql/knex';
import {DefaultQuery, Query} from '../../query';
import {Letter, Parcel} from '../fixtures/models/deliverable';
import {Foo} from '../fixtures/models/foo';
import {Org} from '../fixtures/models/org';
import {ProjWithRelations} from '../fixtures/models/proj';
import {User} from '../fixtures/models/user';
import {seed} from '../fixtures/seed';
import {DB, givenDb, mockPg, Repos} from '../support';

mockPg();

describe('Query', () => {
  describe('initiation', () => {
    it('should create a query with specified client', () => {
      const spy = jest.spyOn(knex, 'createKnex');
      const db = givenDb({connector: 'sqlite3s', file: ':memory:', query: {client: 'better-sqlite3'}});
      const query = new DefaultQuery(db.repos.User);
      expect(query).toBeInstanceOf(DefaultQuery);
      expect(spy).toHaveBeenCalledWith(db.ds, {driver: 'sql', client: 'better-sqlite3'});
    });

    it('should throw error for unsupported database', () => {
      const db = givenDb({connector: 'memory'});
      expect(() => new DefaultQuery(db.repos.User)).toThrowError();
    });
  });

  describe('operations', () => {
    let db: DB;
    let repos: Repos;

    let fooQuery: Query<Foo>;
    let userQuery: Query<User>;
    let orgQuery: Query<Org>;
    let projQuery: Query<ProjWithRelations>;

    beforeAll(async () => {
      db = givenDb({connector: 'sqlite3s', file: ':memory:'});
      repos = db.repos;
      fooQuery = new DefaultQuery<Foo>(repos.Foo);
      userQuery = new DefaultQuery<User>(repos.User);
      orgQuery = new DefaultQuery<Org>(repos.Org);
      projQuery = new DefaultQuery<ProjWithRelations>(repos.Proj);

      await db.ds.automigrate();
      await seed(repos);
    });

    describe('count', () => {
      it('count without relations', async () => {
        const {count} = await userQuery.count();
        expect(count).toEqual(4);
      });

      it('should count with hasOne', async () => {
        const {count} = await userQuery.count({'userInfo.info': {like: `%user1%`}});
        expect(count).toEqual(1);
      });

      it('should count with hasMany', async () => {
        const {count} = await orgQuery.count({'projs.name': {like: `%OrgA%`}});
        expect(count).toEqual(1);
      });

      it('should count with hasMany through', async () => {
        const {count} = await orgQuery.count({'users.email': 'user1@example.com'});
        expect(count).toEqual(2);
      });

      it('should count with belongsTo', async () => {
        const {count} = await projQuery.count({'org.name': {like: `%OrgA%`}});
        expect(count).toEqual(2);
      });

      it('should count with deep relations', async () => {
        const {count} = await orgQuery.count({'projs.issues.creator.email': 'user1@example.com'});
        expect(count).toEqual(2);
      });

      it('should count with multiple relations', async () => {
        const {count} = await orgQuery.count({
          and: [{'projs.issues.creator.email': 'user1@example.com'}, {'projs.name': {like: `%OrgA%`}}],
        });
        expect(count).toEqual(1);
      });
    });

    describe('find', () => {
      it('should find without relations', async () => {
        const result = await userQuery.find();
        expect(result).toHaveLength(4);
        for (const item of result) {
          expect(item).toBeInstanceOf(User);
        }
      });

      it('should find with hasOne', async () => {
        const result = await userQuery.find({where: {'userInfo.info': {like: `%user1%`}}});
        expect(result).toHaveLength(1);
        expect(result[0].email).toContain('user1');
      });

      it('should find with hasMany', async () => {
        const result = await orgQuery.find({where: {'projs.name': {like: `%OrgA%`}}});
        expect(result).toHaveLength(1);
        expect(result[0].name).toEqual('OrgA');
      });

      it('should find with hasMany through', async () => {
        const result = await orgQuery.find({where: {'users.email': 'user1@example.com'}});
        expect(result).toHaveLength(2);
      });

      it('should find with belongsTo', async () => {
        const result = await projQuery.find({where: {'org.name': {like: `%OrgA%`}}});
        expect(result).toHaveLength(2);
        for (const item of result) {
          expect(item.name).toContain('OrgA');
        }
      });

      it('should find with deep relations', async () => {
        const result = await orgQuery.find({where: {'projs.issues.creator.email': 'user1@example.com'}});
        expect(result).toHaveLength(2);
      });

      it('should find with multiple relations', async () => {
        const result = await orgQuery.find({
          where: {
            and: [{'projs.issues.creator.email': 'user1@example.com'}, {'projs.name': {like: `%OrgA%`}}],
          },
        });
        expect(result).toHaveLength(1);
        expect(result[0].name).toEqual('OrgA');
      });
    });

    describe('findOne', function () {
      it('should findOne without relations', async () => {
        const user = await userQuery.findOne();
        expect(user).toBeInstanceOf(User);
        expect(user!.email).toEqual('user1@example.com');
      });

      it('should find with hasOne', async () => {
        const user = await userQuery.findOne({where: {'userInfo.info': {like: `%user1%`}}});
        expect(user).toBeInstanceOf(User);
        expect(user!.email).toEqual('user1@example.com');
      });
    });

    describe('find and include with where', () => {
      it('should include hasOne relation', async () => {
        const users = await userQuery.find({where: {email: 'user1@example.com'}, include: ['userInfo']});
        expect(users).toHaveLength(1);
        expect(users[0]).toBeTruthy();
        expect(users[0].userInfo).toBeTruthy();
      });

      it('should include belongsTo relation', async () => {
        const projects = await projQuery.find({where: {name: {like: '%OrgA%'}}, include: ['org']});
        expect(projects).toHaveLength(2);
        for (const project of projects) {
          expect(project.org).toBeTruthy();
        }
      });

      it('should include hasMany relation', async () => {
        const orgs = await orgQuery.find({where: {name: {like: '%OrgA%'}}, include: ['projs']});
        expect(orgs).toHaveLength(1);
        expect(orgs[0].projs).toBeTruthy();
      });

      it('should include hasMany through relation', async () => {
        const users = await userQuery.find({where: {email: 'user1@example.com'}, include: ['orgs']});
        expect(users).toHaveLength(1);
        expect(users[0].orgs).toHaveLength(2);
        for (const user of users) {
          expect(user.orgs).toBeTruthy();
        }
      });
    });

    describe('invalid relations', function () {
      it('should throw error if relations are invalid', async () => {
        await expect(fooQuery.find({where: {'__invalid_relation__.name': {like: '%FooA%'}}})).rejects.toThrowError(
          /No relation and property found for key/,
        );
      });
    });

    describe('where crossing datasources', function () {
      it('should throw error if entities are not in the same datasource', async () => {
        await expect(fooQuery.find({where: {'birds.name': {like: '%sparrow%'}}})).rejects.toThrow(
          /is not defined in the current datasource for relation/,
        );
      });
    });

    describe('polymorphic relation', function () {
      describe('hasOne', function () {
        it('with $join', async () => {
          const deliveryQuery = new DefaultQuery(repos.Delivery);
          const deliveries = await deliveryQuery.find({
            where: {'deliverable(Letter).id': {neq: null}},
            include: ['deliverable'],
          });
          expect(deliveries).toHaveLength(1);
          expect(deliveries[0].deliverable).toBeTruthy();
          expect(deliveries[0].deliverable).toBeInstanceOf(Letter);
          expect(deliveries[0].deliverable.letterTitle).toEqual('letter1');
        });

        it('with property filter', async () => {
          const deliveryQuery = new DefaultQuery(repos.Delivery);
          const deliveries = await deliveryQuery.find({
            where: {'deliverable(Parcel).parcelTitle': {like: '%parcel1%'}},
            include: ['deliverable'],
          });
          expect(deliveries).toHaveLength(1);
          expect(deliveries[0].deliverable).toBeTruthy();
          expect(deliveries[0].deliverable).toBeInstanceOf(Parcel);
          expect(deliveries[0].deliverable.parcelTitle).toEqual('parcel1');
        });
      });

      describe('belongsTo', function () {
        it('with $join', async () => {
          const transportQuery = new DefaultQuery(repos.Transport);
          const transports = await transportQuery.find({
            where: {'deliverable(Letter).id': {neq: null}},
            include: ['deliverable'],
          });
          expect(transports).toHaveLength(1);
          expect(transports[0].deliverable).toBeTruthy();
          expect(transports[0].deliverable).toBeInstanceOf(Letter);
          expect(transports[0].deliverable.letterTitle).toEqual('letter1');
        });

        it('with property filter', async () => {
          const transportQuery = new DefaultQuery(repos.Transport);
          const transports = await transportQuery.find({
            where: {'deliverable(Parcel).parcelTitle': {like: '%parcel1%'}},
            include: ['deliverable'],
          });
          expect(transports).toHaveLength(1);
          expect(transports[0].deliverable).toBeTruthy();
          expect(transports[0].deliverable).toBeInstanceOf(Parcel);
          expect(transports[0].deliverable.parcelTitle).toEqual('parcel1');
        });
      });

      describe('hasManyThrough', function () {
        it('with $join', async () => {
          const senderQuery = new DefaultQuery(repos.Sender);
          const senders = await senderQuery.find({
            where: {'deliverables(Parcel).id': {neq: null}},
            include: ['deliverables'],
          });
          expect(senders).toHaveLength(1);
          expect(senders[0].deliverables).toBeTruthy();
          expect(senders[0].deliverables).toHaveLength(2);
        });

        it('with property filter and without inclusion filter', async () => {
          const senderQuery = new DefaultQuery(repos.Sender);
          const senders = await senderQuery.find({
            // left join query will not load inclusions and will not be able to filter the included entities
            where: {'deliverables(Parcel).parcelTitle': {like: '%parcel1%'}},
            include: ['deliverables'],
          });
          expect(senders).toHaveLength(1);
          expect(senders[0].deliverables).toBeTruthy();
          expect(senders[0].deliverables).toHaveLength(2);
        });

        it('with property filter and with inclusion filter', async () => {
          const senderQuery = new DefaultQuery(repos.Sender);
          const senders = await senderQuery.find({
            // left join query will not load inclusions and will not be able to filter the included entities
            where: {'deliverables(Parcel).parcelTitle': {like: '%parcel1%'}},
            include: [
              {
                relation: 'deliverables',
                scope: {
                  where: {
                    // filter inclusion of parcels
                    parcelTitle: {like: '%parcel1%'},
                  },
                },
              },
            ],
          });
          expect(senders).toHaveLength(1);
          expect(senders[0].deliverables).toBeTruthy();
          expect(senders[0].deliverables).toHaveLength(1);
        });
      });
    });

    describe('$join', function () {
      it('should find with joins', async () => {
        const users = await userQuery.find({where: {$join: ['userInfo'], 'userInfo.id': {neq: null}}});
        expect(users).toHaveLength(3);
      });
    });

    describe('$expr', () => {
      it('values comparison with 1=1 ', async () => {
        const allFoos = await fooQuery.find();
        const result = await fooQuery.find({where: {$expr: {eq: [1, 1]}}});
        expect(result).toEqual(allFoos);
      });

      it('values comparison with 1=0', async () => {
        const result = await fooQuery.find({where: {$expr: {eq: [1, 0]}}});
        expect(result).toEqual([]);
      });

      it('projection and value comparison', async () => {
        const result = await userQuery.find({where: {$expr: {eq: ['$userInfo.a', 2]}}});
        expect(result).toHaveLength(1);
        expect(result[0].email).toEqual('user2@example.com');
      });

      it('value and projection comparison', async () => {
        const result = await userQuery.find({where: {$expr: {eq: [2, '$userInfo.a']}}});
        expect(result).toHaveLength(1);
        expect(result[0].email).toEqual('user2@example.com');
      });

      it('projection and projection comparison', async () => {
        const result = await userQuery.find({where: {$expr: {eq: ['$userInfo.a', '$userInfo.b']}}});
        expect(result).toHaveLength(1);
        expect(result[0].email).toEqual('user1@example.com');
      });
    });
  });
});
