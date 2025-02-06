import React, { useState, useEffect } from 'react';
import './ReceiptForm.css';
import { ICashReceipt, ReceiptStatus } from '../interfaces/ICashReceipt';

interface ReceiptFormProps {
  receipt?: ICashReceipt;
  onSave: (receipt: ICashReceipt) => void;
  onCancel?: () => void;
}

const ReceiptForm: React.FC<ReceiptFormProps> = ({ receipt, onSave, onCancel }) => {
  const [receiptNumber, setReceiptNumber] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (receipt) {
      setReceiptNumber(receipt.receiptNumber);
      setAmount(receipt.totalAmount.toString());
    } else {
      resetForm();
    }
  }, [receipt]);

  const resetForm = () => {
    setReceiptNumber('');
    setAmount('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLinkedReceipt()) {
      alert('Cannot edit receipt as receipt is linked.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
      alert('Receipt amount must be greater than zero.');
      return;
    }

    onSave({
      id: receipt ? receipt.id : Date.now(),
      receiptNumber: receipt ? receipt.receiptNumber : `Receipt-${receiptNumber}`,
      totalAmount: parsedAmount,
      availableAmount: parsedAmount,
      status: ReceiptStatus.Posted,
    });

    resetForm();
  };

  const isLinkedReceipt = (): boolean => {
    const statementReceiptLinkMap = JSON.parse(localStorage.getItem('statementReceiptLinkMap') || '[]');
    return receipt ? statementReceiptLinkMap.some((item: any) => item.receiptId === receipt.id) : false;
  };

  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="receipt-form">
      <input
        type={receipt ? "text" : "number"}
        value={receiptNumber}
        onChange={(e) => setReceiptNumber(e.target.value)}
        placeholder="Receipt Number"
        required
        disabled={!!receipt}
        className="form-input"
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        required
        className="form-input"
      />
      <button type="submit" className="form-button add-update-form-button">{receipt ? 'Update' : 'Add'} Receipt</button>
      <button type="button" onClick={handleCancel} className="form-button">Cancel</button>
    </form>
  );
};

export default ReceiptForm;
