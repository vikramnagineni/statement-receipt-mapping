import React from 'react';
import './StatementDetail.css'; // Import the CSS file
import { ICashReceipt } from '../interfaces/ICashReceipt';
import { ILinkedCashReceipt } from '../interfaces/ILinkedCashReceipt';
import { IActiveDBEStatement } from '../interfaces/IActiveDBEStatement';

interface StatementDetailProps {
  statement: IActiveDBEStatement;
  availableReceipts?: ICashReceipt[];
  linkedReceipts?: ILinkedCashReceipt[];
  linkReceipt: (receipt: ICashReceipt) => void;
  unlinkReceipt: (receipt: ILinkedCashReceipt) => void;
  refreshDBEDetails: () => void;
}

interface AvailableReceiptTableProps {
  receipts: ICashReceipt[];
  onLink: (receipt: ICashReceipt) => void;
}

interface LinkedReceiptTableProps {
  receipts: ILinkedCashReceipt[];
  onUnlink: (receipt: ILinkedCashReceipt) => void;
}

const AvailableReceiptTable: React.FC<AvailableReceiptTableProps> = ({ receipts, onLink }) => (
  <>
    <h3>Receipts Available For Linking</h3>
    {receipts.length > 0 ? (
      <table className="receipt-table">
        <thead>
          <tr>
            <th>Receipt Number</th>
            {/* <th>Total Amount</th> */}
            <th>Available Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => (
            <tr key={receipt.id}>
              <td className="receipt-number">{receipt.receiptNumber}</td>
              {/* <td className="receipt-amount">{receipt.totalAmount}</td> */}
              <td className="receipt-available-amount">{receipt.availableAmount}</td>
              <td>
                <button className="link-receipt-button" onClick={() => onLink(receipt)}>
                  Link
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      'No receipts available for linking.'
    )}
  </>
);

const LinkedReceiptTable: React.FC<LinkedReceiptTableProps> = ({ receipts, onUnlink }) => (
  <>
    <h3>Linked Receipts</h3>
    {receipts.length > 0 ? (
      <table className="receipt-table">
        <thead>
          <tr>
            <th>Receipt Number</th>
            <th>Allocated Amount</th>
            <th>Available Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {receipts.map((receipt) => (
            <tr key={receipt.id}>
              <td className="receipt-number">{receipt.receiptNumber}</td>
              <td className="receipt-amount">{receipt.allocatedAmount}</td>
              <td className="receipt-amount">{receipt.availableAmount}</td>
              <td>
                <button className="unlink-receipt-button" onClick={() => onUnlink(receipt)}>
                  Unlink
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      'No linked receipts'
    )}
  </>
);

const StatementDetail: React.FC<StatementDetailProps> = ({
  statement,
  availableReceipts = [],
  linkedReceipts = [],
  linkReceipt,
  unlinkReceipt,
  refreshDBEDetails,
}) => (
  <div>
    <h2>
      "{statement.statementNumber}" Details:{' '}
      <button className="refresh-button" onClick={refreshDBEDetails}>
        Refresh
      </button>
      {statement.pendingAmount == 0 && <h3 className="balanced-indicator">BALANCED</h3>}
    </h2>
    <h4>
      Total Amount: {statement.totalAmount} | Balanced Amount: {statement.balancedAmount} |
      Outstanding Amount: {statement.pendingAmount}
    </h4>

    <AvailableReceiptTable receipts={availableReceipts} onLink={linkReceipt} />

    <LinkedReceiptTable receipts={linkedReceipts} onUnlink={unlinkReceipt} />
  </div>
);

export default StatementDetail;
