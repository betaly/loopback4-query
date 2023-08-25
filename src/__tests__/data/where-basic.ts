export default [
  {
    name: 'empty query',
    model: 'Foo',
    where: {},
    sql: 'select * from "public"."foo"',
    bindings: [],
  },
  {
    name: 'query with key/value in key/value',
    model: 'Foo',
    where: {a: 5},
    sql: 'select * from "public"."foo" where "a" = ?',
    bindings: [5],
  },
  {
    name: 'query with value using "=" operator',
    model: 'Foo',
    where: {a: {'=': 5}},
    sql: 'select * from "public"."foo" where "a" = ?',
    bindings: [5],
  },
  {
    name: 'query with value using ">" operator',
    model: 'Foo',
    where: {a: {'>': 5}},
    sql: 'select * from "public"."foo" where "a" > ?',
    bindings: [5],
  },
  {
    name: 'query with value using "gt" operator',
    model: 'Foo',
    where: {a: {gt: 5}},
    sql: 'select * from "public"."foo" where "a" > ?',
    bindings: [5],
  },
  {
    name: 'query with value using "<" operator',
    model: 'Foo',
    where: {a: {'<': 5}},
    sql: 'select * from "public"."foo" where "a" < ?',
    bindings: [5],
  },
  {
    name: 'query with value using "lt" operator',
    model: 'Foo',
    where: {a: {lt: 5}},
    sql: 'select * from "public"."foo" where "a" < ?',
    bindings: [5],
  },
  {
    name: 'query with value using ">=" operator',
    model: 'Foo',
    where: {a: {'>=': 5}},
    sql: 'select * from "public"."foo" where "a" >= ?',
    bindings: [5],
  },
  {
    name: 'query with value using "gte" operator',
    model: 'Foo',
    where: {a: {gte: 5}},
    sql: 'select * from "public"."foo" where "a" >= ?',
    bindings: [5],
  },
  {
    name: 'query with value using "<=" operator',
    model: 'Foo',
    where: {a: {'<=': 5}},
    sql: 'select * from "public"."foo" where "a" <= ?',
    bindings: [5],
  },
  {
    name: 'query with value using "lte" operator',
    model: 'Foo',
    where: {a: {lte: 5}},
    sql: 'select * from "public"."foo" where "a" <= ?',
    bindings: [5],
  },
  {
    name: 'query with value using "in" operator',
    model: 'Foo',
    where: {a: {in: [5, 8, 12]}},
    sql: 'select * from "public"."foo" where "a" in (?, ?, ?)',
    bindings: [5, 8, 12],
  },
  {
    name: 'query with value using "inq" operator',
    model: 'Foo',
    where: {a: {inq: [5, 8, 12]}},
    sql: 'select * from "public"."foo" where "a" in (?, ?, ?)',
    bindings: [5, 8, 12],
  },
  {
    name: 'query with null value using "inq" operator',
    model: 'Foo',
    where: {a: {inq: [5, undefined, 12]}},
    sql: 'select * from "public"."foo" where "a" in (?, ?, ?)',
    bindings: [5, null, 12],
  },
  {
    name: 'query with value using "between" operator',
    model: 'Foo',
    where: {a: {between: [5, 12]}},
    sql: 'select * from "public"."foo" where "a" between ? and ?',
    bindings: [5, 12],
  },
  {
    name: 'query with null value using "between" operator - 1',
    model: 'Foo',
    where: {a: {between: [undefined, 12]}},
    sql: 'select * from "public"."foo" where "a" between ? and ?',
    bindings: [null, 12],
  },
  {
    name: 'query with null value using "between" operator - 2',
    model: 'Foo',
    where: {a: {between: [5, undefined]}},
    sql: 'select * from "public"."foo" where "a" between ? and ?',
    bindings: [5, null],
  },
  {
    name: 'query with null value using "between" operator - 3',
    model: 'Foo',
    where: {a: {between: [undefined, undefined]}},
    sql: 'select * from "public"."foo" where "a" between ? and ?',
    bindings: [null, null],
  },
  {
    name: 'query with value using "like" operator',
    model: 'Foo',
    where: {a: {like: '%banana%'}},
    sql: 'select * from "public"."foo" where "a" like ?',
    bindings: ['%banana%'],
  },
  {
    name: 'query with value using "ilike" operator',
    model: 'Foo',
    where: {a: {ilike: '%banana%'}},
    sql: 'select * from "public"."foo" where "a" ilike ?',
    bindings: ['%banana%'],
  },
  {
    name: 'query with null value',
    model: 'Foo',
    where: {a: null},
    sql: 'select * from "public"."foo" where "a" is null',
    bindings: [],
  },
  {
    name: 'query with null value in "=" operator',
    model: 'Foo',
    where: {a: {'=': null}},
    sql: 'select * from "public"."foo" where "a" is null',
    bindings: [],
  },
  {
    name: 'query with not null value',
    model: 'Foo',
    where: {not: {a: null}},
    sql: 'select * from "public"."foo" where not ("a" is null)',
    bindings: [],
  },
  {
    name: 'query with null value in "=" operator',
    model: 'Foo',
    where: {not: {a: {'=': null}}},
    sql: 'select * from "public"."foo" where not ("a" is null)',
    bindings: [],
  },
  {
    name: 'query with value using "not" operator',
    model: 'Foo',
    where: {not: {a: 5}},
    sql: 'select * from "public"."foo" where not ("a" = ?)',
    bindings: [5],
  },
  {
    name: 'query with value using "!" operator',
    model: 'Foo',
    where: {'!': {a: 5}},
    sql: 'select * from "public"."foo" where not ("a" = ?)',
    bindings: [5],
  },
  {
    name: 'query with 2 key/value pairs',
    model: 'Foo',
    where: {a: 5, b: 6},
    sql: 'select * from "public"."foo" where "a" = ? and "b" = ?',
    bindings: [5, 6],
  },
  {
    name: 'query with "or"',
    model: 'Foo',
    where: {or: [{a: 5}, {b: 6}]},
    sql: 'select * from "public"."foo" where (("a" = ?) or ("b" = ?))',
    bindings: [5, 6],
  },
  {
    name: 'query with "and"',
    model: 'Foo',
    where: {and: [{a: 5}, {b: 6}]},
    sql: 'select * from "public"."foo" where (("a" = ?) and ("b" = ?))',
    bindings: [5, 6],
  },
  {
    name: 'query with "or" with two variables per or',
    model: 'Foo',
    where: {
      or: [
        {a: 5, b: 3},
        {a: 2, b: 6},
      ],
    },
    sql: 'select * from "public"."foo" where (("a" = ? and "b" = ?) or ("a" = ? and "b" = ?))',
    bindings: [5, 3, 2, 6],
  },
  {
    name: 'query with "or" with object variables',
    model: 'Foo',
    where: {or: {a: 5, b: 3}},
    sql: 'select * from "public"."foo" where (("a" = ?) or ("b" = ?))',
    bindings: [5, 3],
  },
  {
    name: 'query with "or" with two operations',
    model: 'Foo',
    where: {or: [{a: {'>': 5}}, {b: {'<': 6}}]},
    sql: 'select * from "public"."foo" where (("a" > ?) or ("b" < ?))',
    bindings: [5, 6],
  },
  {
    name: 'query with "props" and "or"',
    model: 'Foo',
    where: {a: 1, or: [{b: {'>': 2}}, {c: {'<': 3}}]},
    sql: 'select * from "public"."foo" where "a" = ? and (("b" > ?) or ("c" < ?))',
    bindings: [1, 2, 3],
  },
  {
    name: 'query with "or" with nested "and"',
    model: 'Foo',
    where: {
      or: [
        {
          and: [{a: {'>': 10}}, {b: {'>': 20}}],
        },
        {
          and: [{a: {'<': 4}}, {b: {'<': 6}}],
        },
      ],
    },
    sql: 'select * from "public"."foo" where (((("a" > ?) and ("b" > ?))) or ((("a" < ?) and ("b" < ?))))',
    bindings: [10, 20, 4, 6],
  },
  {
    name: 'query with $expr with values equal comparison',
    model: 'Foo',
    where: {$expr: {eq: [true, false]}},
    sql: 'select * from "public"."foo" where ? = ?',
    bindings: [true, false],
  },
  {
    name: 'query with $expr with projections equal comparison',
    model: 'Foo',
    where: {$expr: {eq: ['$a', '$b']}},
    sql: 'select * from "public"."foo" where "a" = "b"',
    bindings: [],
  },
  {
    name: 'query with $expr with projection and value equal comparison',
    model: 'Foo',
    where: {$expr: {eq: ['$a', 1]}},
    sql: 'select * from "public"."foo" where "a" = ?',
    bindings: [1],
  },
  {
    name: 'query with $expr with value and projection equal comparison',
    model: 'Foo',
    where: {$expr: {eq: ['1', '$b']}},
    sql: 'select * from "public"."foo" where ? = "b"',
    bindings: ['1'],
  },
  {
    name: 'query with $expr with values comparison',
    model: 'Foo',
    where: {$expr: {gt: [true, false]}},
    sql: 'select * from "public"."foo" where ? > ?',
    bindings: [true, false],
  },
  {
    name: 'query with $expr with projections comparison',
    model: 'Foo',
    where: {$expr: {gt: ['$a', '$b']}},
    sql: 'select * from "public"."foo" where "a" > "b"',
    bindings: [],
  },
  {
    name: 'query with $expr with projection and value comparison',
    model: 'Foo',
    where: {$expr: {gt: ['$a', 1]}},
    sql: 'select * from "public"."foo" where "a" > ?',
    bindings: [1],
  },
  {
    name: 'query with $expr with value and projection comparison',
    model: 'Foo',
    where: {$expr: {gt: ['1', '$b']}},
    sql: 'select * from "public"."foo" where ? > "b"',
    bindings: ['1'],
  },
];