/* eslint-disable @typescript-eslint/no-explicit-any */
import {QuerySession} from '../session';

export interface WhereSpec {
  only?: boolean;
  name: string;
  model: string;
  where: object;
  sql: string;
  bindings: any[];
  session: QuerySession;
}
