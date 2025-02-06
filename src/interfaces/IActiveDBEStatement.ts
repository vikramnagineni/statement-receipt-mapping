import { IDBEStatement } from "./IDBEStatement";

export interface IActiveDBEStatement extends IDBEStatement {
    balancedAmount?: number;
    pendingAmount?: number;
  }