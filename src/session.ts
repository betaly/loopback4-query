import {RelationConstraint, RelationJoin} from './relation';

export interface QuerySessionData {
  relationJoins?: RelationJoin[];
  relationWhere?: Record<string, RelationConstraint>;
  relationOrder?: Record<string, RelationConstraint>;
}

export class QuerySession {
  readonly relationJoins: RelationJoin[];
  readonly relationWhere: Record<string, RelationConstraint>;
  readonly relationOrder: Record<string, RelationConstraint>;

  private _seq = 0;

  static create(sessionOrData?: QuerySession | QuerySessionData) {
    return sessionOrData instanceof QuerySession ? sessionOrData : new QuerySession(sessionOrData);
  }

  protected constructor(data?: QuerySessionData) {
    this.relationJoins = data?.relationJoins ?? [];
    this.relationWhere = data?.relationWhere ?? {};
    this.relationOrder = data?.relationOrder ?? {};
  }

  currentSeq() {
    return this._seq;
  }

  nextSeq() {
    return this._seq++;
  }

  hasRelations() {
    return this.hasRelationJoins() || this.hasRelationWhere() || this.hasRelationOrder();
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
