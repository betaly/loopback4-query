import {DataObject} from '@loopback/repository';

import {RelationConstraint, RelationJoin} from './relation';

export class QuerySession {
  readonly relationJoins: RelationJoin[];
  readonly relationWhere: Record<string, RelationConstraint>;
  readonly relationOrder: Record<string, RelationConstraint>;

  private _seq = 0;

  constructor(data?: DataObject<QuerySession>) {
    Object.assign(this, data);
    this.relationJoins = this.relationJoins ?? [];
    this.relationWhere = this.relationWhere ?? {};
    this.relationOrder = this.relationOrder ?? {};
  }

  currentSeq() {
    return this._seq;
  }

  nextSeq() {
    return this._seq++;
  }

  hasRelationJoins() {
    return this.relationJoins.length > 0;
  }

  hasRelationWhere() {
    return Object.keys(this.relationWhere).length > 0;
  }

  hasRelationOrder() {
    return Object.keys(this.relationOrder).length > 0;
  }

  addRelationJoin(join: RelationJoin) {
    this.relationJoins.push(join);
    return join;
  }

  setRelationWhere(key: string, constraint: RelationConstraint) {
    this.relationWhere[key] = constraint;
  }

  setRelationOrder(key: string, constraint: RelationConstraint) {
    this.relationOrder[key] = constraint;
  }
}
