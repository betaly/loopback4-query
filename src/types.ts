/* eslint-disable @typescript-eslint/no-explicit-any */
import {Entity} from '@loopback/repository';

export type WhereExprKey = any;
export type WhereValue = any;

export type IdSort = boolean | 'numericIdOnly';

export type EntityClass<T extends Entity = Entity> = typeof Entity & {prototype: T};

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];
