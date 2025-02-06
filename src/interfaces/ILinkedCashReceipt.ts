import { ICashReceipt } from "./ICashReceipt";

export interface ILinkedCashReceipt extends ICashReceipt {
    allocatedAmount: number;
    mappedAt: Date;
}