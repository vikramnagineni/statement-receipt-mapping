export interface IDBEStatement {
    id: number;
    statementNumber: string;
    totalAmount: number;
    status: StatementStatus;
  }

  export enum StatementStatus {
    Posted = 'Posted',
    Void = 'Void',
  }