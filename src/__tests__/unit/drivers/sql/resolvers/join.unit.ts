/* eslint-disable @typescript-eslint/no-explicit-any */
import {Filter} from '@loopback/filter';
import {Knex} from 'knex';
import each from 'tily/object/each';
import {DeepPartial} from 'ts-essentials';

import {createKnex, JoinResolver} from '../../../../../drivers';
import {RelationConstraint} from '../../../../../relation';
import {QuerySession} from '../../../../../session';
import {Delivery} from '../../../../fixtures/models/delivery';
import {Foo} from '../../../../fixtures/models/foo';
import {Issue} from '../../../../fixtures/models/issue';
import {Org} from '../../../../fixtures/models/org';
import {Proj} from '../../../../fixtures/models/proj';
import {Sender} from '../../../../fixtures/models/sender';
import {Transport} from '../../../../fixtures/models/transport';
import {User} from '../../../../fixtures/models/user';
import {DB, givenDb, givenJoinResolver, givenJoinResolvers, mockPg} from '../../../../support';

mockPg();

describe('resolvers/join', () => {
  let db: DB;
  let resolvers: Record<string, JoinResolver<any>>;
  let knex: Knex;
  let session: QuerySession;

  beforeEach(() => {
    db = givenDb({connector: 'postgresql'});
    resolvers = givenJoinResolvers(db.ds);
    knex = createKnex(db.ds);
  });

  beforeEach(() => {
    session = new QuerySession();
  });

  it('should resolve empty query', () => {
    testJoin(
      knex,
      resolvers[Foo.name],
      session,
      {},

      'select * from "public"."foo"',
    );
  });

  it('should resolve query with belongsTo join', () => {
    testJoin(
      knex,
      resolvers[Issue.name],
      session,
      {
        where: {
          'proj.name': 'loopback',
        },
      },
      'select * from "public"."issue" left join "public"."proj" as "t_0_0_proj" on "issue"."projId" = "t_0_0_proj"."id"',
      {
        'proj.name': {
          prefix: 't_0_0_',
          model: 'Proj',
          property: {key: 'name'},
        },
      },
    );
  });

  it('should resolve query with hasOne join', () => {
    testJoin(
      knex,
      resolvers[User.name],
      session,
      {
        where: {
          'userInfo.info': 'loopback',
        },
      },
      'select * from "public"."user" left join "public"."userinfo" as "t_0_0_userinfo" on "user"."id" = "t_0_0_userinfo"."userid"',
      {
        'userInfo.info': {
          prefix: 't_0_0_',
          model: 'UserInfo',
          property: {key: 'info'},
        },
      },
    );
  });

  it('should resolve query with hasMany join', () => {
    testJoin(
      knex,
      resolvers[Proj.name],
      session,
      {
        where: {
          'issues.title': 'loopback',
        },
      },
      'select * from "public"."proj" left join "public"."issue" as "t_0_0_issue" on "proj"."id" = "t_0_0_issue"."projId"',
      {
        'issues.title': {
          prefix: 't_0_0_',
          model: 'Issue',
          property: {key: 'title'},
        },
      },
    );
  });

  it('should resolve query with hasMany through join', () => {
    testJoin(
      knex,
      resolvers[Org.name],
      session,
      {
        where: {
          'users.email': {
            ilike: '%@gmail.com',
          },
        },
      },
      'select * from "public"."org" left join "public"."orguser" as "t_0_0_orguser" on "org"."id" = "t_0_0_orguser"."orgid" left join "public"."user" as "t_0_0_user" on "t_0_0_orguser"."userid" = "t_0_0_user"."id"',
      {
        'users.email': {
          prefix: 't_0_0_',
          model: 'User',
          property: {key: 'email'},
        },
      },
    );
  });

  it('should resolve query with hasMany through join and multiple conditions', () => {
    testJoin(
      knex,
      resolvers[Org.name],
      session,
      {
        where: {
          or: [
            {
              'users.email': {
                ilike: '%@gmail.com',
              },
            },
            {
              'users.userInfo.info': {
                ilike: '%abc%',
              },
            },
          ],
        },
      },
      'select * from "public"."org" left join "public"."orguser" as "t_0_0_orguser" on "org"."id" = "t_0_0_orguser"."orgid" left join "public"."user" as "t_0_0_user" on "t_0_0_orguser"."userid" = "t_0_0_user"."id" left join "public"."userinfo" as "t_2_1_userinfo" on "t_0_0_user"."id" = "t_2_1_userinfo"."userid"',
      {
        'users.email': {
          prefix: 't_0_0_',
          model: 'User',
          property: {key: 'email'},
        },
        'users.userInfo.info': {
          prefix: 't_2_1_',
          model: 'UserInfo',
          property: {key: 'info'},
        },
      },
    );
  });

  it('should resolve query with deep hasMany join', () => {
    testJoin(
      knex,
      resolvers[Org.name],
      session,
      {
        where: {
          'projs.issues.title': 'loopback',
        },
      },
      'select * from "public"."org" left join "public"."proj" as "t_0_0_proj" on "org"."id" = "t_0_0_proj"."org_id" left join "public"."issue" as "t_1_1_issue" on "t_0_0_proj"."id" = "t_1_1_issue"."projId"',
      {
        'projs.issues.title': {
          prefix: 't_1_1_',
          model: 'Issue',
          property: {key: 'title'},
        },
      },
    );
  });

  it('should resolve query with `or` operator', () => {
    testJoin(
      knex,
      resolvers[Org.name],
      session,
      {
        where: {
          and: [
            {
              'projs.issues.title': 'a',
            },
            {
              'projs.issues.title': 'b',
            },
          ],
        },
      },
      'select * from "public"."org" left join "public"."proj" as "t_0_0_proj" on "org"."id" = "t_0_0_proj"."org_id" left join "public"."issue" as "t_1_1_issue" on "t_0_0_proj"."id" = "t_1_1_issue"."projId"',
      {
        'projs.issues.title': {
          prefix: 't_1_1_',
          model: 'Issue',
          property: {key: 'title'},
        },
      },
    );
  });

  it('should resolve query with `and` operator', () => {
    testJoin(
      knex,
      resolvers[Org.name],
      session,
      {
        where: {
          and: [
            {
              'projs.issues.closed': false,
            },
            {
              'projs.issues.title': 'a',
            },
          ],
        },
      },
      'select * from "public"."org" left join "public"."proj" as "t_0_0_proj" on "org"."id" = "t_0_0_proj"."org_id" left join "public"."issue" as "t_1_1_issue" on "t_0_0_proj"."id" = "t_1_1_issue"."projId"',
      {
        'projs.issues.closed': {
          prefix: 't_1_1_',
          model: 'Issue',
          property: {key: 'closed'},
        },
        'projs.issues.title': {
          prefix: 't_1_1_',
          model: 'Issue',
          property: {key: 'title'},
        },
      },
    );
  });

  it('should resolve query with join and deep json', () => {
    testJoin(
      knex,
      resolvers[Org.name],
      session,
      {
        where: {
          'users.address.city': 'HK',
        },
      },
      'select * from "public"."org" left join "public"."orguser" as "t_0_0_orguser" on "org"."id" = "t_0_0_orguser"."orgid" left join "public"."user" as "t_0_0_user" on "t_0_0_orguser"."userid" = "t_0_0_user"."id"',
      {
        'users.address.city': {
          prefix: 't_0_0_',
          model: 'User',
          property: {key: 'address.city'},
        },
      },
    );
  });

  describe('Polymorphic Relations', function () {
    it('hasOne', () => {
      testJoin(
        knex,
        givenJoinResolver(Delivery, db),
        session,
        {
          where: {
            'deliverable(Parcel).parcelTitle': 'parcel2',
          },
        },
        'select * from "public"."delivery" left join "public"."parcel" as "t_0_0_parcel" on "delivery"."id" = "t_0_0_parcel"."deliveryid" and "delivery"."deliverabletype" = ?',
        {
          'deliverable(Parcel).parcelTitle': {
            prefix: 't_0_0_',
            model: 'Parcel',
            property: {key: 'parcelTitle'},
          },
        },
      );
    });

    it('belongsTo', async () => {
      testJoin(
        knex,
        givenJoinResolver(Transport, db),
        session,
        {
          where: {
            'deliverable(Parcel).parcelTitle': 'parcel2',
          },
        },
        'select * from "public"."transport" left join "public"."parcel" as "t_0_0_parcel" on "transport"."deliverableid" = "t_0_0_parcel"."id" and "transport"."deliverabletype" = ?',
        {
          'deliverable(Parcel).parcelTitle': {
            prefix: 't_0_0_',
            model: 'Parcel',
            property: {key: 'parcelTitle'},
          },
        },
      );
    });

    it('hasMayThrough', async () => {
      testJoin(
        knex,
        givenJoinResolver(Sender, db),
        session,
        {
          where: {
            'deliverables(Parcel).parcelTitle': 'parcel2',
          },
        },
        'select * from "public"."sender" left join "public"."senderdeliverable" as "t_0_0_senderdeliverable" on "sender"."id" = "t_0_0_senderdeliverable"."senderid" left join "public"."parcel" as "t_0_0_parcel" on "t_0_0_senderdeliverable"."deliverableid" = "t_0_0_parcel"."id" and "t_0_0_senderdeliverable"."deliverabletype" = ?',
        {
          'deliverables(Parcel).parcelTitle': {
            prefix: 't_0_0_',
            model: 'Parcel',
            property: {key: 'parcelTitle'},
          },
        },
      );
    });
  });
});

function testJoin(
  knex: Knex,
  resolver: JoinResolver<any>,
  session: QuerySession,
  filter: Filter,
  expectedSql: string,
  expectedRelationWhere: Record<string, DeepPartial<RelationConstraint>> = {},
  expectedRelationOrder: Record<string, DeepPartial<RelationConstraint>> = {},
) {
  const qb = knex(resolver.tableEscaped()).queryContext({skipEscape: true});
  resolver.resolve(qb, filter, session);
  const s = qb.toSQL();
  expect(s.sql).toEqual(expectedSql);

  expect(Object.keys(session.relationWhere).length).toEqual(Object.keys(expectedRelationWhere).length);
  expect(Object.keys(session.relationOrder).length).toEqual(Object.keys(expectedRelationOrder).length);

  each((value, key) => {
    expect(session.relationWhere[key]).toMatchObject(value);
  }, expectedRelationWhere);

  each((value, key) => {
    expect(session.relationOrder[key]).toMatchObject(value);
  }, expectedRelationOrder);
}
