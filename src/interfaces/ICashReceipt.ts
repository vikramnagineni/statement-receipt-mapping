export interface ICashReceipt {
    id: number;
    receiptNumber: string;
    totalAmount: number;
    availableAmount: number;
    status: ReceiptStatus;
  }

  export enum ReceiptStatus {
    Posted = 'Posted',
    Void = 'Void',
  }