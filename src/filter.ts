/* eslint-disable @typescript-eslint/no-explicit-any */
import {Filter, ShortHandEqualType} from '@loopback/filter';
import {KeyOf, Operators, PredicateComparison} from '@loopback/filter/src/query';
import {AnyObject} from '@loopback/repository';

export type ExprVar = any;

export type NullablePredicateComparison<PT> = Omit<PredicateComparison<PT>, 'eq' | 'neq'> & {
  eq?: PT | null;
  neq?: PT | null;
};

/**
 * Condition clause
 *
 * @example
 * ```ts
 * {
 *   name: {inq: ['John', 'Mary']},
 *   status: 'ACTIVE',
 *   age: {gte: 40}
 * }
 * ```
 */
export type QueryCondition<MT extends object> =
  | {
      [P in KeyOf<MT>]?:
        | NullablePredicateComparison<MT[P]> // {x: {lt: 1}}
        | (MT[P] & ShortHandEqualType) // {x: 1},
        | null;
    }
  | Record<string, NullablePredicateComparison<ShortHandEqualType> | ShortHandEqualType | null>;

export type QueryWhere<MT extends object = AnyObject> =
  | QueryCondition<MT>
  | QueryAndClause<MT>
  | QueryOrClause<MT>
  | ExprClause
  | JoinClause;

export type ExprClause = {
  $expr: {[op in Operators]?: [ExprVar, ExprVar]};
};

export type JoinClause = {
  $join: string | string[];
};

/**
 * And clause
 *
 * @example
 * ```ts
 * {
 *   and: [...],
 * }
 * ```
 */
export interface QueryAndClause<MT extends object> {
  and: QueryWhere<MT>[];
}

/**
 * Or clause
 *
 * @example
 * ```ts
 * {
 *   or: [...],
 * }
 * ```
 */
export interface QueryOrClause<MT extends object> {
  or: QueryWhere<MT>[];
}

export type QueryFilter<MT extends object = AnyObject> = Omit<Filter<MT>, 'where'> & {
  where?: QueryWhere<MT>;
};
