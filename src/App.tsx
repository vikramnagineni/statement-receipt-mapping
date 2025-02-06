import React, { useEffect, useState } from 'react';
import StatementList from './components/StatementList';
import ReceiptList from './components/ReceiptList';
import StatementDetail from './components/StatementDetail';
import './App.css'; // Import stylesheet
import { IDBEStatement, StatementStatus } from './interfaces/IDBEStatement';
import { ICashReceipt, ReceiptStatus } from './interfaces/ICashReceipt';
import { ILinkedCashReceipt } from './interfaces/ILinkedCashReceipt';
import { IActiveDBEStatement } from './interfaces/IActiveDBEStatement';
import { IStatementsReceiptsMapping } from './interfaces/IStatementsReceiptsMapping';
import { StorageService } from './services.ts/StorageService';

const App = () => {
  const [allStatements, updateStatements] = useState<IDBEStatement[]>([]);
  const [allReceipts, updateReceipts] = useState<ICashReceipt[]>([]);
  const [availableReceiptsForLinking, updateAvailableReceiptsForLinking] = useState<ICashReceipt[]>([]);
  const [linkedReceiptsForStatement, updateLinkedReceiptsForStatement] = useState<ILinkedCashReceipt[]>([]);
  const [activeStatement, setActiveStatement] = useState<IActiveDBEStatement | null>(null);

  useEffect(() => {
    const storedStatements: IDBEStatement[] = StorageService.getStatements();
    const storedReceipts: ICashReceipt[] = StorageService.getReceipts()

    storedStatements.sort((a, b) => a.statementNumber.localeCompare(b.statementNumber));
    updateStatements(storedStatements);

    storedReceipts.sort((a, b) => a.receiptNumber.localeCompare(b.receiptNumber));
    updateReceipts(storedReceipts);
  }, []);


  const handleStatementSelection = (selectedStatement: IDBEStatement) => {
    let linkedReceiptsForStatement: ILinkedCashReceipt[] = [];
    let availableReceiptsForLinking: ICashReceipt[] = [];

    const allReceipts: ICashReceipt[] = StorageService.getReceipts();

    let allActiveReceipts = allReceipts.filter(receipt => receipt.status != ReceiptStatus.Void);

    const statementsReceiptsMapping: IStatementsReceiptsMapping[] = StorageService.getMappings();
    if (statementsReceiptsMapping.length === 0) {
      updateLinkedReceiptsForStatement([]);
      initializeAvailableStatementReceipts(selectedStatement);
      return;
    }

    linkedReceiptsForStatement = statementsReceiptsMapping.filter(
      (mapping) => mapping.statementId === selectedStatement.id
    ).map((mapping) => {
      const receipt = allActiveReceipts.find((receipt: ICashReceipt) => receipt.id === mapping.receiptId);

      const associatedStatements = statementsReceiptsMapping.filter(
        (mapping) => mapping.receiptId === receipt?.id
      );

      const receiptTotalAllocatedAmount = associatedStatements.reduce(
        (total, link) => total + (link.allocatedAmount ?? 0),
        0
      );
      return { ...receipt, mappedAt: mapping.mappedAt, allocatedAmount: mapping.allocatedAmount, availableAmount: receipt?.totalAmount! - receiptTotalAllocatedAmount } as ILinkedCashReceipt;
    });

      availableReceiptsForLinking = allActiveReceipts.reduce<ICashReceipt[]>((acc, receipt) => {
        // Skip receipts already linked
        const isLinked = linkedReceiptsForStatement.some(linkedReceipt => linkedReceipt.id === receipt.id);
        if (isLinked) return acc;
      
        // Calculate total allocated amount for this receipt
        const receiptTotalAllocatedAmount = statementsReceiptsMapping.reduce(
          (total, map) => map.receiptId === receipt.id ? total + (map.allocatedAmount ?? 0) : total,
          0
        );
      
        // Calculate available amount
        const availableAmount = receipt.totalAmount! - receiptTotalAllocatedAmount;
        
        // Add to results if available amount is positive
        if (availableAmount > 0) {
          acc.push({ ...receipt, availableAmount });
        }
      
        return acc;
      }, []);
      
      

    const balancedAmount = linkedReceiptsForStatement.reduce(
      (total, receipt) => total + (receipt.allocatedAmount ?? 0),
      0
    );

    setActiveStatement({
      ...selectedStatement,
      balancedAmount: balancedAmount,
      pendingAmount: selectedStatement.totalAmount - balancedAmount,
    });

    updateLinkedReceiptsForStatement(linkedReceiptsForStatement);
    updateAvailableReceiptsForLinking(availableReceiptsForLinking);
  }

  const initializeAvailableStatementReceipts = (statement: IDBEStatement) => {
    let allReceipts = StorageService.getReceipts();
    let availableReceiptsForLinking = allReceipts.filter(receipt => receipt.status != ReceiptStatus.Void).map((receipt: ICashReceipt) => {
      return { ...receipt, availableAmount: receipt?.totalAmount! } as ICashReceipt;
    });

    updateAvailableReceiptsForLinking(availableReceiptsForLinking);

    setActiveStatement({
      ...statement,
      balancedAmount: 0,
      pendingAmount: statement.totalAmount,
    });
  };

  const refreshDBEDetails = () => {
     handleStatementSelection(activeStatement!);
  };

  const handleLinkReceipt = (receipt: ICashReceipt) => {
    if (!activeStatement) return;

    const mappings: IStatementsReceiptsMapping[] = StorageService.getMappings();

    // Calculate current statement balance
    const statementMappings = mappings.filter(m => m.statementId === activeStatement.id);
    const statementBalancedAmount = statementMappings.reduce((sum, m) => sum + (m.allocatedAmount ?? 0), 0);
    const statementPendingAmount = activeStatement.totalAmount - statementBalancedAmount;

    // Check if statement is already balanced
  if (statementBalancedAmount >= activeStatement.totalAmount) {
    alert('Statement is already balanced.');
    return;
  }

    // Calculate receipt available amount
    const receiptMappings = mappings.filter(m => m.receiptId === receipt.id);
    const receiptTotalAllocatedAmount = receiptMappings.reduce((sum, m) => sum + (m.allocatedAmount ?? 0), 0);
    const receiptAvailableAmount = receipt.totalAmount - receiptTotalAllocatedAmount;

    
    if (receiptAvailableAmount <= 0) {
      alert('Receipt is fully allocated.');
      return;
    }

    // Calculate allocation amount
    const amountToAllocate = Math.min(
      statementPendingAmount,
      receiptAvailableAmount
    );

    let mapping: IStatementsReceiptsMapping = {
      receiptId: receipt.id,
      statementId: activeStatement.id,
      allocatedAmount: amountToAllocate,
      mappingId: Date.now(),
      mappedAt: new Date(),
    }
    mappings.push(mapping);

    StorageService.saveMappings(mappings);
    refreshDBEDetails();
  };

  const autoAllocateActiveStatement = (unlinkedReceipt: ILinkedCashReceipt) => {
    if (!activeStatement) return;

    let mappings: IStatementsReceiptsMapping[] = StorageService.getMappings();

    // Filter and sort linked receipts excluding the unlinked receipt
    const filteredMappings = mappings.filter(mapping => 
      mapping.statementId === activeStatement.id && mapping.receiptId !== unlinkedReceipt.id
    );

    // Calculate total allocated amount for the current statement
    const balancedAmount = filteredMappings.reduce((acc, item) => acc + (item.allocatedAmount ?? 0), 0);
    let pendingAmount = activeStatement.totalAmount - balancedAmount;

    // Sort by the date they were mapped
    filteredMappings.sort((a, b) => new Date(a.mappedAt).getTime() - new Date(b.mappedAt).getTime());

    for (let mapping of filteredMappings) {
      if (pendingAmount <= 0) break; // Exit if there is no pending amount
  
      let allReceipts = StorageService.getReceipts();
      const receipt = allReceipts.find(r => r.id === mapping.receiptId && r.status !== ReceiptStatus.Void);
      if (!receipt) continue;
  
      // Calculate the available amount for each receipt
      const receiptAllocated = mappings.reduce((acc, m) => m.receiptId === receipt.id ? acc + (m.allocatedAmount ?? 0) : acc, 0);
      const availableAmount = receipt.totalAmount - receiptAllocated;
  
      if (availableAmount > 0) {
        // Allocate as much as needed or available
        const allocationAmount = Math.min(pendingAmount, availableAmount);
        mapping.allocatedAmount += allocationAmount;
        pendingAmount -= allocationAmount;
      }
    }

    // updateLinkedReceiptsForStatement(updatedLinkedReceipts);
    StorageService.saveMappings(mappings);
  };

  const autoAllocateOtherStatements = (unlinkedReceipt: ILinkedCashReceipt) => {
    let mappings: IStatementsReceiptsMapping[] = StorageService.getMappings();
  
    // Calculate total allocated amount for the unlinked receipt
    const receiptLinks = mappings.filter(mapping => mapping.receiptId === unlinkedReceipt.id);
    let receiptTotalAllocatedAmount = receiptLinks.reduce((acc, item) => acc + (item.allocatedAmount ?? 0), 0);
    let receiptUnallocatedAmount = unlinkedReceipt.totalAmount - receiptTotalAllocatedAmount;
  
    for (const statement of receiptLinks) {
      if (receiptUnallocatedAmount <= 0) break; // Exit loop if there's no unallocated amount left
  
      const statementLinks = mappings.filter(mapping => mapping.statementId === statement.statementId);
      const statementBalancedAmount = statementLinks.reduce((acc, item) => acc + (item.allocatedAmount ?? 0), 0);
      let allStatements = StorageService.getStatements();
      const statementTotalAmount = allStatements.find(s => s.id === statement.statementId)?.totalAmount;
  
      if (!statementTotalAmount || statementBalancedAmount >= statementTotalAmount) continue; // Skip balanced statements
  
      const statementUnbalancedAmount = statementTotalAmount - statementBalancedAmount;
      const amountToAllocateFromCurrentReceipt = Math.min(statementUnbalancedAmount, receiptUnallocatedAmount);
  
      // Update mapping directly if there's allocation amount
      if (amountToAllocateFromCurrentReceipt > 0) {
        mappings = mappings.map(mapping =>
          (mapping.receiptId === unlinkedReceipt.id && mapping.statementId === statement.statementId)
            ? { ...mapping, allocatedAmount: (mapping.allocatedAmount ?? 0) + amountToAllocateFromCurrentReceipt }
            : mapping
        );
        receiptUnallocatedAmount -= amountToAllocateFromCurrentReceipt;
      }
    }
  
    StorageService.saveMappings(mappings);
  };
  
  const handleUnlinkReceipt = (unlinkedReceipt: ILinkedCashReceipt) => {
    let storedMapping: IStatementsReceiptsMapping[] = StorageService.getMappings()
  
    // Remove link for the given receipt and statement
    const statementsReceiptsMapping = storedMapping.filter(item =>
      !(item.receiptId === unlinkedReceipt.id && item.statementId === activeStatement?.id)
    );
  
    StorageService.saveMappings(statementsReceiptsMapping);
  
    autoAllocateActiveStatement(unlinkedReceipt);
    autoAllocateOtherStatements(unlinkedReceipt);
  
    // Refresh the active statement details
    if (activeStatement) {
      handleStatementSelection(activeStatement);
    }
  };
  

  const handleAddOrUpdateStatement = (statement: IDBEStatement) => {
    const normalizedName = statement.statementNumber.toUpperCase();

    let allStatements = StorageService.getStatements();
    // Check for duplicate statement number (excluding the current statement)
    const isDuplicate = allStatements.some(
      (s) => s.statementNumber === normalizedName && s.id !== statement.id
    );

    if (isDuplicate) {
      alert('A statement with the same number already exists.');
      return;
    }

    // Update or add the statement
    const updatedStatements = allStatements.map((s) =>
      s.id === statement.id ? { ...statement, name: normalizedName } : s
    );

    // Add new statement if it doesn't exist
    if (!updatedStatements.some((s) => s.id === statement.id)) {
      updatedStatements.push({ ...statement, name: normalizedName });
    }

    // Update state and local storage
    updatedStatements.sort((a, b) => a.statementNumber.localeCompare(b.statementNumber));
    updateStatements(updatedStatements);
    StorageService.saveStatements(updatedStatements);
  };


  const handleDeleteStatement = (id: number) => {
    const storedMapping = StorageService.getMappings();

    if (storedMapping) {

      // Check if there are linked receipts
      if (storedMapping.some(item => item.statementId === id)) {
        alert('Cannot delete statement as receipts are already linked.');
        return;
      }
    }

    const isConfirmed = window.confirm('Are you sure you want to delete this statement?');;

    if (!isConfirmed) {
      return;  // If not confirmed, exit the function
    }

    let allStatements = StorageService.getStatements();
    // Update and persist statements after deletion
    const updatedStatements = allStatements.filter(statement => statement.id !== id);
    updateStatements(updatedStatements);
    StorageService.saveStatements(updatedStatements);

    if(activeStatement && activeStatement.id === id) {
      setActiveStatement(null);
    }
  };


  const handleAddOrUpdateReceipt = (receipt: ICashReceipt) => {
    let allReceipts = StorageService.getReceipts();
    const existingReceipt = allReceipts.find(
      r => r.receiptNumber === receipt.receiptNumber && r.id !== receipt.id
    );

    if (existingReceipt) {
      alert('A receipt with the same name already exists.');
      return;
    }

    const updatedReceipts = allReceipts.map(r =>
      r.id === receipt.id ? receipt : r
    );

    // Add the receipt if it's new
    if (!allReceipts.some(r => r.id === receipt.id)) {
      updatedReceipts.push(receipt);
    }

    updatedReceipts.sort((a, b) => a.receiptNumber.localeCompare(b.receiptNumber));

    updateReceipts(updatedReceipts);
    StorageService.saveReceipts(updatedReceipts);

    // Refresh the active statement details
    if (activeStatement) {
      handleStatementSelection(activeStatement);
    }
  };


  const handleDeleteReceipt = (id: number) => {
    const storedMapping = StorageService.getMappings();

    if (storedMapping && storedMapping.some((item: IStatementsReceiptsMapping) => item.receiptId === id)) {
      alert('Cannot delete receipt as it is linked.');
      return;
    }

    const isConfirmed = window.confirm('Are you sure you want to delete this rceipt?');;

    if (!isConfirmed) {
      return;  // If not confirmed, exit the function
    }

    let allReceipts = StorageService.getReceipts();
    const updatedReceipts = allReceipts.filter(receipt => receipt.id !== id);
    updateReceipts(updatedReceipts);
    StorageService.saveReceipts(updatedReceipts);

    // Refresh the active statement details
    if (activeStatement) {
      handleStatementSelection(activeStatement);
    }
  };

  const handleVoidStatement = (statementId: number): void => {
    const isConfirmed = window.confirm('Are you sure you want to void this statement? This will unlink  all linked receipts and void the statement.');;

    if (!isConfirmed) {
      return;  // If not confirmed, exit the function
    }

    let allStatements = StorageService.getStatements();
    allStatements.forEach(statement => {
      if (statement.id === statementId) {
        statement.status = StatementStatus.Void;
      }
    });
    updateStatements([...allStatements]);
    StorageService.saveStatements(allStatements);

    
    // TODO: unlik all receipts and autoallocate every reciept in other statements

    // Refresh the active statement details
    if (activeStatement) {
      handleStatementSelection(activeStatement);
    }
  }

  const handleVoidReceipt = (receiptId: number): void => {
    const isConfirmed = window.confirm('Are you sure you want to void this receipt? This will unlink the reciept from all statements.');;

    if (!isConfirmed) {
      return;  // If not confirmed, exit the function
    }

    let allReceipts = StorageService.getReceipts();
    allReceipts.forEach(receipt => {
      if (receipt.id === receiptId) {
        receipt.status = ReceiptStatus.Void;
      }
    });
    updateReceipts([...allReceipts]);
    StorageService.saveReceipts(allReceipts);

    // TODO: unlik receipt from all statements and autoallocate other statements


    // Refresh the active statement details
    if (activeStatement) {
      handleStatementSelection(activeStatement);
    }
  }

  return (
    <div className="app-container">
      <div className="list-container">
        <div className="statement-list-container">
          <StatementList
            statements={allStatements}
            onSelect={handleStatementSelection}
            onDelete={handleDeleteStatement}
            onVoid={handleVoidStatement}
            onUpdate={handleAddOrUpdateStatement}
          />
        </div>
        <div className="receipt-list-container">
          <ReceiptList
            receipts={allReceipts}
            onDelete={handleDeleteReceipt}
            onVoid={handleVoidReceipt}
            onUpdate={handleAddOrUpdateReceipt}
          />
        </div>
      </div>
      <hr />
      {activeStatement && (
        <div className="statement-detail">
          <StatementDetail
            statement={activeStatement}
            availableReceipts={availableReceiptsForLinking}
            linkedReceipts={linkedReceiptsForStatement}
            linkReceipt={handleLinkReceipt}
            unlinkReceipt={handleUnlinkReceipt}
            refreshDBEDetails={refreshDBEDetails}
          />
        </div>
      )}
    </div>
  );
};

export default App;