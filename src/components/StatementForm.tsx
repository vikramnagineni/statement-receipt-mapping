import React, { useState, useEffect } from 'react';
import './StatementForm.css'; // Import the CSS file for styling
import { IDBEStatement, StatementStatus } from '../interfaces/IDBEStatement';

interface StatementFormProps {
  statement?: IDBEStatement | null;
  onSave: (statement: IDBEStatement) => void;
  onCancel?: () => void;
}

const StatementForm: React.FC<StatementFormProps> = ({ statement, onSave, onCancel }) => {
  const [statementNumber, setStatementNumber] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (statement) {
      setStatementNumber(statement.statementNumber);
      setAmount(statement.totalAmount.toString());
    } else {
      setStatementNumber('');
      setAmount('');
    }
  }, [statement]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const statementReceiptLinkMap = JSON.parse(localStorage.getItem('statementReceiptLinkMap') || '[]');
    if (statement && statementReceiptLinkMap.some((item: any) => item.statementId === statement.id)) {
      alert('Cannot edit statement as receipts are already linked.');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (parsedAmount <= 0) {
      alert('Statement amount must be greater than zero.');
      return;
    }

    onSave({
      id: statement ? statement.id : Date.now(),
      statementNumber: statement ? statement.statementNumber : `DBE-${statementNumber}`,
      totalAmount: parsedAmount,
      status: StatementStatus.Posted
    });

    resetForm();
  };


  const handleCancel = () => {
    resetForm();
    onCancel?.();
  };

  const resetForm = () => {
    setStatementNumber('');
    setAmount('');
  };

  return (
    <form onSubmit={handleSubmit} className="statement-form">
      <input
        type={statement ? 'text' : 'number'}
        value={statementNumber}
        onChange={(e) => setStatementNumber(e.target.value)}
        placeholder="Statement Number"
        required
        disabled={!!statement}
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
      <button type="submit" className="form-button add-update-form-button">{statement ? 'Update' : 'Add'} Statement</button>
      <button type="button" onClick={handleCancel} className="form-button">Cancel</button>
    </form>
  );
};

export default StatementForm;