'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { ExpensesTable } from '@/components/expenses/expenses-table';
import { ExpenseDialog } from '@/components/expenses/expense-dialog';
import type { Expense } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export default function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(null);

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
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedExpense(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedExpense(null);
  };

  const isLoading = isUserLoading || expensesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">מעקב הוצאות</h2>
          <p className="text-muted-foreground">הצג, הוסף וערוך את ההוצאות שלך.</p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="ms-2 h-4 w-4" />
          הוסף הוצאה
        </Button>
      </div>
      {isLoading ? (
         <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <ExpensesTable expenses={expenses || []} onEdit={handleEdit} />
      )}
      <ExpenseDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        expense={selectedExpense}
      />
    </div>
  );
}
