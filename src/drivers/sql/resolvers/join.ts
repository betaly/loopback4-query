/* eslint-disable @typescript-eslint/no-floating-promises */
import {Operators} from '@loopback/filter';
import {
  AnyObject,
  Entity,
  HasManyDefinition,
  ModelDefinition,
  RelationMetadata,
  RelationType,
} from '@loopback/repository';
import debugFactory from 'debug';
import {Knex} from 'knex';
import includes from 'tily/array/includes';
import toArray from 'tily/array/toArray';
import {assert} from 'tily/assert';
import isArray from 'tily/is/array';
import isPlainObject from 'tily/is/plainObject';
import {isString} from 'tily/is/string';

import {ExprClause, JoinClause, QueryFilter, QueryWhere} from '../../../filter';
import {
  QueryRelationMetadata,
  RelationConstraint,
  RelationJoin,
  resolveRelation,
  SupportedRelationTypes,
} from '../../../relation';
import {QuerySession} from '../../../session';
import {ClauseResolver} from '../clause';
import {Directives, GroupOperators} from '../types';

const debug = debugFactory('bleco:query:join');

export class JoinResolver<TModel extends Entity> extends ClauseResolver<TModel> {
  resolve(
    qb: Knex.QueryBuilder<TModel>,
    filter: QueryFilter<TModel>,
    session: QuerySession = new QuerySession(),
  ): void {
    debug(`Resolving where clause for model ${this.entityClass.modelName}:`, filter, session);
    const {where, order} = filter;
    if (!where && !order) {
      debug('No where or order found, skip resolving');
      return;
    }
    if ((typeof where !== 'object' || Array.isArray(where)) && !order) {
      debug('Invalid where: %j', where);
      return;
    }

    if (where) {
      for (const key of extractKeys(where)) {
        this.compile(key, session, session.relationWhere);
      }
    }

    if (order) {
      for (const key of toArray(order)) {
        this.compile(retrieveOrderKey(key), session, session.relationOrder);
      }
    }

    this.buildJoins(qb, session);
  }

  protected buildJoins(qb: Knex.QueryBuilder, session: QuerySession) {
    // TODO: support MySQL and Postgres "uuid" type for id column: https://github.com/Wikodit/loopback-connector-postgresql/blob/develop/lib/postgresql.js#L965
    const orm = this.orm;
    for (const relationJoin of session.relationJoins) {
      assert(relationJoin.relation.keyFrom, 'relation.keyFrom is required');
      assert(relationJoin.relation.keyTo, 'relation.keyTo is required');

      const targetModel = relationJoin.model;

      if (!orm.getModelDefinition(targetModel)) {
        throw new Error(
          `Model "${relationJoin.model}" is not defined in the current datasource for relation "${relationJoin.relationPath}".`,
        );
      }

      qb.leftJoin(
        {
          [orm.escapeName(relationJoin.prefix + orm.table(targetModel))]: orm.tableEscaped(targetModel),
        },
        // eslint-disable-next-line @typescript-eslint/no-shadow
        qb => {
          qb.on(
            orm.columnEscaped(
              relationJoin.parentModel,
              relationJoin.relation!.keyFrom!,
              true,
              relationJoin.parentPrefix,
            ),
            orm.columnEscaped(targetModel, relationJoin.relation!.keyTo!, true, relationJoin.prefix),
          );
          if (relationJoin.polymorphic?.value) {
            qb.onVal(
              orm.columnEscaped(
                relationJoin.parentModel,
                relationJoin.polymorphic.discriminator,
                true,
                relationJoin.parentPrefix,
              ),
              relationJoin.polymorphic.value,
            );
          }
        },
      );
    }
  }

  protected compile(key: string, session: QuerySession, constraints: Record<string, RelationConstraint>) {
    const {definition} = this.entityClass;

    const parsed = parseRelationChain(definition, key);
    if (!parsed) {
      return;
    }
    const {relationChain, property, propertyKey} = parsed;

    const relationPath = this.entityClass.modelName;

    let parentPrefix = '';
    let parentEntity = this.entityClass;
    let join: RelationJoin | undefined;
    let potentialRelationPath = relationPath;

    for (let i = 0; i < relationChain.length; i++) {
      const modelDefinition = parentEntity.definition;

      // Build a prefix for alias to prevent conflict
      const prefix = nextPrefix(session, i);
      const {name: candidateRelation, polymorphicValue} = relationChain[i];
      potentialRelationPath += '.' + candidateRelation;

      if (!modelDefinition) {
        debug('No definition for model %s', parentEntity);
        break;
      }

      if (!(candidateRelation in modelDefinition.relations)) {
        debug('No relation for model %s', parentEntity.modelName);
        break;
      }

      if (includes(candidateRelation, definition.settings.hiddenRelations ?? [])) {
        debug('Hidden relation for model %s skipping', parentEntity.modelName);
        break;
      }

      let relation = modelDefinition.relations[candidateRelation] as QueryRelationMetadata;

      // Only supports belongsTo, hasOne and hasMany
      if (!SupportedRelationTypes.includes(relation.type)) {
        debug('Invalid relation type for model %s for left join', parentEntity.modelName);
        break;
      }

      relation = resolveRelation(relation);

      const target = relation.target();
      let polymorphic;

      // Check if the relation is already joined
      join = session.relationJoins.find(j => potentialRelationPath === j.relationPath);
      if (!join) {
        // Join the relation
        if (relation.type === RelationType.hasMany && relation.through) {
          const throughEntity = relation.through.model();

          polymorphic = isPlainObject(relation.through.polymorphic)
            ? {
                discriminator: relation.through.polymorphic.discriminator,
                value: polymorphicValue,
              }
            : undefined;

          // Add through relation join
          session.addRelationJoin({
            relationPath: `${relationPath}.-.${candidateRelation}`,
            prefix,
            parentPrefix,
            parentModel: parentEntity.modelName,
            relation: {
              keyFrom: relation.keyFrom,
              keyTo: relation.through.keyFrom,
              name: `_${candidateRelation}_`,
            } as HasManyDefinition,
            model: throughEntity.modelName,
          });

          parentPrefix = prefix;
          parentEntity = throughEntity;
          relation = {
            keyFrom: relation.through.keyTo,
            keyTo: relation.keyTo,
          } as HasManyDefinition;
        } else {
          polymorphic =
            'polymorphic' in relation && isPlainObject(relation.polymorphic)
              ? {
                  discriminator: relation.polymorphic.discriminator,
                  value: polymorphicValue,
                }
              : undefined;
        }

        // add relation join
        join = session.addRelationJoin({
          relationPath: potentialRelationPath,
          prefix,
          parentPrefix,
          parentModel: parentEntity.modelName,
          relation: {
            ...(relation as QueryRelationMetadata),
            name: candidateRelation,
          },
          model: polymorphic?.value ?? target.modelName,
          polymorphic,
        });
      }
      // Keep the prefix of the found join
      parentPrefix = join.prefix;
      // Keep the parentEntity for recursive JOIN
      parentEntity = target;
    }

    if (!join) return;

    // Keep what needed to build the WHERE or ORDER statement properly
    constraints[key] = {
      prefix: join.prefix,
      model: join.model,
      property: {
        ...property,
        key: propertyKey,
      },
    };
  }
}

export function parseRelationChain(definition: ModelDefinition, key: string) {
  const members = parseKey(key);

  let i = 0;
  let relation = definition.relations[members[i]?.name];
  if (relation) {
    let next = relation.target().definition.relations[members[++i]?.name];
    while (next) {
      relation = next;
      next = relation.target().definition.relations[members[++i]?.name];
    }
  }

  // no relation found
  if (!relation) {
    if (!definition.properties[members[0]?.name]) {
      throw new Error(`No relation and property found for key "${key}" in model "${definition.name}"`);
    }
    // ignore nested properties
    return;
  }
  // no property left
  if (i >= members.length) {
    return {
      relationChain: members,
    };
  }

  const relationChain = members.slice(0, i);
  const propertyName = members[i].name;
  const target = relation.target().definition;

  // property may be undefined if the relation is polymorphic and target is ancestor class
  const property = target.properties[propertyName];

  if (!hasPolymorphic(relation) && !property) {
    throw new Error(
      `"${propertyName}" is not in model "${target.name}" with relation chain "${relationChain
        .map(r => r.name)
        .join('.')}"`,
    );
  }

  for (let j = i; j < members.length; j++) {
    if (members[j].polymorphicValue) {
      throw new Error(`polymorphic should not be with property: ${propertyName}`);
    }
  }

  return {
    relationChain,
    property,
    propertyKey: members
      .slice(i)
      .map(m => m.name)
      .join('.'),
  };
}

interface Member {
  name: string;
  polymorphicValue?: string;
}

function parseKey(key: string): Member[] {
  return key.split('.').map(part => {
    const from = part.indexOf('(');
    const to = part.lastIndexOf(')');
    if ((from < 0 && to >= 0) || (from >= 0 && to < 0)) {
      throw new Error(`Invalid key "${key}"`);
    }
    if (from < 0) {
      return {name: part};
    } else {
      return {name: part.substring(0, from), polymorphicValue: part.substring(from + 1, to)};
    }
  });
}

function extractKeys(where: QueryWhere, keys = new Set<string>()): Set<string> {
  for (const key in where) {
    if (GroupOperators.includes(key)) {
      // {and|or: [{...}]}
      const clauses = (where as AnyObject)[key];
      if (Array.isArray(clauses)) {
        for (const clause of clauses) {
          extractKeys(clause, keys);
        }
      }
    } else if (key === Directives.EXPR) {
      // extract $expr
      const expr = (where as ExprClause).$expr;
      const op = Object.keys(expr)[0] as Operators;
      if (!op) continue;
      const value = expr[op];
      assert(isArray(value) && value.length === 2, `$expr->${op} must be an array value with 2 elements`);
      for (const v of value) {
        if (isString(v) && v.startsWith('$')) {
          keys.add(v.substring(1));
        }
      }
    } else if (key === Directives.JOIN) {
      const joins = (where as JoinClause).$join;
      toArray(joins).forEach(j => keys.add(j));
    } else {
      keys.add(key);
    }
  }
  return keys;
}

function hasPolymorphic(relation: RelationMetadata) {
  const rel = 'through' in relation && relation.through ? relation.through : relation;
  return 'polymorphic' in rel && isPlainObject(rel.polymorphic);
}

function retrieveOrderKey(key: string) {
  const t = key.split(/[\s,]+/);
  return t.length === 1 ? key : t[0];
}

function nextPrefix(session: QuerySession, i: number) {
  return `t_${session.nextSeq()}_${i}_`;
}
