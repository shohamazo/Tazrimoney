'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { BudgetCard } from '@/components/budget/budget-card';
import { budgets } from '@/lib/data';
import type { Budget } from '@/lib/types';
import { EditBudgetDialog } from '@/components/budget/edit-budget-dialog';

export default function BudgetPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedBudget, setSelectedBudget] = React.useState<Budget | null>(null);

  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedBudget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ניהול תקציב</h2>
          <p className="text-muted-foreground">הגדר יעדים ועקוב אחר ההוצאות שלך בכל קטגוריה.</p>
        </div>
        <Button variant="outline" onClick={() => handleEdit(budgets[0])}>
          <Pencil className="ms-2 h-4 w-4" />
          ערוך תקציבים
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => (
          <BudgetCard key={budget.category} budget={budget} onEdit={handleEdit} />
        ))}
      </div>
       <EditBudgetDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        budget={selectedBudget}
      />
    </div>
  );
}
