import {
  BelongsToDefinition,
  HasManyDefinition,
  HasOneDefinition,
  PropertyDefinition,
  RelationType,
} from '@loopback/repository';
import {resolveBelongsToMetadata} from '@loopback/repository/dist/relations/belongs-to/belongs-to.helpers';
import {resolveHasManyMetadata} from '@loopback/repository/dist/relations/has-many/has-many.helpers';
import {resolveHasManyThroughMetadata} from '@loopback/repository/dist/relations/has-many/has-many-through.helpers';
import {resolveHasOneMetadata} from '@loopback/repository/dist/relations/has-one/has-one.helpers';

export type QueryRelationMetadata = HasManyDefinition | BelongsToDefinition | HasOneDefinition;

export interface RelationJoin {
  prefix: string;
  parentPrefix: string;
  relationPath: string;
  parentModel: string;
  relation: QueryRelationMetadata;
  model: string;
  polymorphic?: {
    discriminator: string;
    value?: string;
  };
}

export interface RelationConstraint {
  prefix: string;
  model: string;
  property?: Partial<PropertyDefinition>;
}

export const SupportedRelationTypes = [RelationType.hasMany, RelationType.belongsTo, RelationType.hasOne];

export function resolveRelation(relation: QueryRelationMetadata) {
  if (relation.type === RelationType.belongsTo) {
    relation = resolveBelongsToMetadata(relation);
  } else if (relation.type === RelationType.hasOne) {
    relation = resolveHasOneMetadata(relation);
  } else if (relation.type === RelationType.hasMany) {
    if (relation.through) {
      relation = resolveHasManyThroughMetadata(relation);
    } else {
      relation = resolveHasManyMetadata(relation);
    }
  }
  return relation;
}
