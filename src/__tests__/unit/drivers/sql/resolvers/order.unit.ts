/* eslint-disable @typescript-eslint/no-explicit-any */
import {Filter} from '@loopback/filter';
import {Knex} from 'knex';

import {createKnex} from '../../../../../drivers/sql/knex';
import {OrderResolver} from '../../../../../drivers/sql/resolvers';
import {QuerySession} from '../../../../../session';
import {Foo} from '../../../../fixtures/models/foo';
import {DB, givenDb, givenOrderResolvers, mockPg} from '../../../../support';

mockPg();

describe('resolvers/order', () => {
  let db: DB;
  let resolvers: Record<string, OrderResolver<any>>;
  let knex: Knex;
  let session: QuerySession;

  beforeAll(() => {
    db = givenDb({connector: 'postgresql'});
    resolvers = givenOrderResolvers(db.ds);
    knex = createKnex(db.ds);
  });

  beforeEach(() => {
    session = QuerySession.create();
  });

  it('should resolve empty order', () => {
    testOrder(
      knex,
      resolvers[Foo.name],
      session,
      {},

      'select * from "public"."foo"',
    );
  });

  it('should resolve query with order without direction', () => {
    testOrder(
      knex,
      resolvers[Foo.name],
      session,
      {order: ['a', 'b', 'c']},
      'select * from "public"."foo" order by "foo"."a" asc, "foo"."b" asc, "foo"."c" asc',
    );
  });

  it('should resolve query with order with direction', () => {
    testOrder(
      knex,
      resolvers[Foo.name],
      session,
      {order: ['a desc', 'b asc', 'c']},
      'select * from "public"."foo" order by "foo"."a" desc, "foo"."b" asc, "foo"."c" asc',
    );
  });

  it('should resolve query with deep order and relative info', () => {
    testOrder(
      knex,
      resolvers[Foo.name],
      QuerySession.create({
        relationOrder: {
          'a.b.c': {
            prefix: 't_0_0_',
            model: 'User',
            property: {key: 'c'},
          },
        },
      }),
      {order: ['a.b.c desc']},
      'select * from "public"."foo" order by "t_0_0_user"."c" desc',
    );
  });

  it('should resolve query as deep json order without relation info', () => {
    testOrder(
      knex,
      resolvers[Foo.name],
      session,
      {order: ['a.b.c desc']},
      'select * from "public"."foo" order by "foo"."a"->\'b\'->>\'c\' desc',
    );
  });
});

function testOrder(
  knex: Knex,
  resolver: OrderResolver<any>,
  session: QuerySession,
  filter: Filter,
  expectedSql: string,
) {
  const qb = knex(resolver.tableEscaped()).queryContext({skipEscape: true});
  resolver.resolve(qb, filter, session);
  const s = qb.toSQL();
  expect(s.sql).toEqual(expectedSql);
}
