import { IDBEStatement } from '../interfaces/IDBEStatement';
import { ICashReceipt } from '../interfaces/ICashReceipt';
import { IStatementsReceiptsMapping } from '../interfaces/IStatementsReceiptsMapping';

export const StorageService = {
  getStatements(): IDBEStatement[] {
    const data = localStorage.getItem('statements');
    return data ? JSON.parse(data) : [];
  },

  saveStatements(statements: IDBEStatement[]): void {
    localStorage.setItem('statements', JSON.stringify(statements));
  },

  getReceipts(): ICashReceipt[] {
    const data = localStorage.getItem('receipts');
    return data ? JSON.parse(data) : [];
  },

  saveReceipts(receipts: ICashReceipt[]): void {
    localStorage.setItem('receipts', JSON.stringify(receipts));
  },

  getMappings(): IStatementsReceiptsMapping[] {
    const data = localStorage.getItem('statementsReceiptsMapping');
    return data ? JSON.parse(data) : [];
  },

  saveMappings(mappings: IStatementsReceiptsMapping[]): void {
    localStorage.setItem('statementsReceiptsMapping', JSON.stringify(mappings));
  }
};
