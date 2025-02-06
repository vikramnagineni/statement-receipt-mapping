import React, { useState } from 'react';
import StatementForm from './StatementForm';
import './StatementList.css'; // Import the CSS file
import { IDBEStatement, StatementStatus } from '../interfaces/IDBEStatement';

interface StatementListProps {
  statements: IDBEStatement[];
  onSelect: (statement: IDBEStatement) => void;
  onDelete: (statementId: number) => void;
  onVoid: (statementId: number) => void;
  onUpdate: (statement: IDBEStatement) => void;
}

const StatementList: React.FC<StatementListProps> = ({ statements, onSelect, onDelete, onVoid, onUpdate }) => {
  const [editingStatement, setEditingStatement] = useState<IDBEStatement | null>(null);

  const handleEdit = (statement: IDBEStatement) => {
    const statementReceiptLinkMap = JSON.parse(localStorage.getItem('statementReceiptLinkMap') || '[]');
    if (statementReceiptLinkMap.some((item: any) => item.statementId === statement.id)) {
      alert('Cannot edit statement as receipts are already linked.');
      return;
    }
    setEditingStatement(statement);
  };

  const handleSave = (statement: IDBEStatement) => {
    onUpdate(statement);
    setEditingStatement(null);
  };

  const handleCancel = () => {
    setEditingStatement(null);
  };

  return (
    <div className="statement-list">
      <h2>Statements</h2>
      {statements.length === 0 ? (
        <p>There are no statements. Add one by using the form below.</p>
      ) : (
        <table className="statement-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {statements.map((statement) => (
              <tr key={statement.id}>
                <td className="statement-name">{statement.statementNumber}</td>
                <td className="statement-amount">{statement.totalAmount}</td>
                <td className="statement-status">{statement.status}</td>
                <td>
                  <a
                    href="#"
                    className={`edit-link ${statement.status === StatementStatus.Void ? 'link-disabled' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleEdit(statement);
                    }}
                    style={{ pointerEvents: statement.status === StatementStatus.Void ? 'none' : 'auto' }}
                  >Edit</a>
                  <a
                    href="#"
                    className={`delete-link ${(statement.status === StatementStatus.Void || statement.id === editingStatement?.id) ? 'link-disabled' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(statement.id);
                    }}
                  >Delete</a>
                  <a
                    href="#"
                    className={`void-link ${(statement.status === StatementStatus.Void || statement.id === editingStatement?.id) ? 'link-disabled' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onVoid(statement.id);
                    }}
                    style={{ pointerEvents: statement.status === StatementStatus.Void ? 'none' : 'auto' }}
                  >Void</a>
                  <a
                    href="#"
                    className={`details-link ${(statement.status === StatementStatus.Void  || statement.id === editingStatement?.id)? 'link-disabled' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelect(statement);
                    }}
                    style={{ pointerEvents: statement.status === StatementStatus.Void ? 'none' : 'auto' }}
                  >Details</a>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      )}
      <h3>{editingStatement ? 'Edit Statement' : 'Add Statement'}</h3>
      <StatementForm
        statement={editingStatement}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default StatementList;