'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, ScanLine } from 'lucide-react';
import { ExpensesTable } from '@/components/expenses/expenses-table';
import { ExpenseDialog } from '@/components/expenses/expense-dialog';
import type { Expense } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { ReceiptUploadDialog } from '@/components/expenses/receipt-upload-dialog';

export default function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(null);
  const [prefilledData, setPrefilledData] = React.useState<Partial<Expense> | null>(null);

  const { firestore, user, isUserLoading } = useFirebase();

  const expensesQuery = useMemoFirebase(
    () =>
      firestore && user
        ? query(collection(firestore, 'users', user.uid, 'expenses'), orderBy('date', 'desc'))
        : null,
    [firestore, user]
  );
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setPrefilledData(null);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedExpense(null);
    setPrefilledData(null);
    setDialogOpen(true);
  };

  const handleScanNew = () => {
    setReceiptDialogOpen(true);
  };
  
  const handleReceiptAnalyzed = (data: Partial<Expense>) => {
    setReceiptDialogOpen(false);
    setSelectedExpense(null);
    setPrefilledData(data);
    setDialogOpen(true);
  }

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedExpense(null);
    setPrefilledData(null);
  };

  const isLoading = isUserLoading || expensesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">מעקב הוצאות</h2>
          <p className="text-muted-foreground">הצג, הוסף וערוך את ההוצאות שלך.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleScanNew} variant="outline">
            <ScanLine className="ms-2 h-4 w-4" />
            סרוק קבלה
          </Button>
          <Button onClick={handleAddNew}>
            <PlusCircle className="ms-2 h-4 w-4" />
            הוסף הוצאה
          </Button>
        </div>
      </div>
      {isLoading ? (
         <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : expenses && expenses.length > 0 ? (
        <ExpensesTable expenses={expenses} onEdit={handleEdit} />
      ) : (
        <div className="flex flex-col justify-center items-center h-96 border-2 border-dashed rounded-lg bg-card text-center p-8">
            <h3 className="text-xl font-semibold">אין הוצאות להציג</h3>
            <p className="text-muted-foreground mt-2">התחל על ידי הוספת ההוצאה הראשונה שלך או סריקת קבלה.</p>
            <Button onClick={handleAddNew} className="mt-6">
              <PlusCircle className="ms-2 h-4 w-4" />
              הוסף הוצאה
            </Button>
        </div>
      )}
      <ExpenseDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        expense={selectedExpense}
        prefilledData={prefilledData}
      />
      <ReceiptUploadDialog
        isOpen={receiptDialogOpen}
        onOpenChange={setReceiptDialogOpen}
        onReceiptAnalyzed={handleReceiptAnalyzed}
      />
    </div>
  );
}
