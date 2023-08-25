import {Operators} from '@loopback/filter';
import {ValueOf} from 'ts-essentials';

export type FieldOperators = Operators | '!' | '=' | '!=' | '<' | '<=' | '>' | '>=' | 'in' | 'not';

export const GroupOperators = ['and', 'or', 'not', '!', 'related'];

export const Directives = {
  EXPR: '$expr',
  JOIN: '$join',
} as const;

export type Directive = ValueOf<typeof Directives>;
