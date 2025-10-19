'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { ExpensesTable } from '@/components/expenses/expenses-table';
import { ExpenseDialog } from '@/components/expenses/expense-dialog';
import type { Expense } from '@/lib/types';

export default function ExpensesPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedExpense, setSelectedExpense] = React.useState<Expense | null>(null);

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
      <ExpensesTable onEdit={handleEdit} />
      <ExpenseDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        expense={selectedExpense}
      />
    </div>
  );
}
