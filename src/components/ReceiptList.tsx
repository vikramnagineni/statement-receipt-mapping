import React, { useState } from 'react';
import ReceiptForm from './ReceiptForm';
import './ReceiptList.css'; // Import the CSS file
import { ICashReceipt, ReceiptStatus } from '../interfaces/ICashReceipt';

interface ReceiptListProps {
  receipts: ICashReceipt[];
  onDelete: (id: number) => void;
  onVoid: (id: number) => void;
  onUpdate: (receipt: ICashReceipt) => void;
}

const ReceiptList: React.FC<ReceiptListProps> = ({ receipts, onDelete, onVoid, onUpdate }) => {
  const [editingReceipt, setEditingReceipt] = useState<ICashReceipt | null>(null);

  const handleEdit = (receipt: ICashReceipt) => {
    const statementReceiptLinkMap = JSON.parse(localStorage.getItem('statementReceiptLinkMap') || '[]');
    const isLinked = statementReceiptLinkMap.some((item: any) => item.receiptId === receipt.id);

    if (isLinked) {
      alert('Cannot edit receipt as receipt is linked.');
      return;
    }

    setEditingReceipt(receipt);
  };

  const handleSave = (receipt: ICashReceipt) => {
    onUpdate(receipt);
    setEditingReceipt(null);
  };

  return (
    <div className="receipt-list">
      <h2>Receipts</h2>
      {receipts.length === 0 ? (
        <p>There are no receipts. Add one using the form below.</p>
      ) : (
        <table className="receipt-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map((receipt) => (
              <tr key={receipt.id}>
                <td className="receipt-name">{receipt.receiptNumber}</td>
                <td className="receipt-amount">{receipt.totalAmount}</td>
                <td className="receipt-status">{receipt.status}</td>
                <td>
                  <a
                    href="#"
                    className={`edit-link ${receipt.status === ReceiptStatus.Void ? 'link-disabled' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleEdit(receipt);
                    }}
                    style={{ pointerEvents: receipt.status === ReceiptStatus.Void ? 'none' : 'auto' }}
                  >Edit</a>
                  <a
                    href="#"
                    className={`delete-link ${receipt.id === editingReceipt?.id ? 'link-disabled' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(receipt.id);
                    }}
                  >Delete</a>
                  <a
                    href="#"
                    className={`void-link ${(receipt.status === ReceiptStatus.Void || receipt.id === editingReceipt?.id)? 'link-disabled' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onVoid(receipt.id);
                    }}
                    style={{ pointerEvents: receipt.status === ReceiptStatus.Void ? 'none' : 'auto' }}
                  >Void</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h3>{editingReceipt ? 'Edit Receipt' : 'Add Receipt'}</h3>
      <ReceiptForm
        receipt={editingReceipt!}
        onSave={handleSave}
        onCancel={() => setEditingReceipt(null)}
      />
    </div>
  );
};

export default ReceiptList;
