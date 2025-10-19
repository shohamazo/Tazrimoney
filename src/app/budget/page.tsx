'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { BudgetCard } from '@/components/budget/budget-card';
import type { Budget, Expense } from '@/lib/types';
import { EditBudgetDialog } from '@/components/budget/edit-budget-dialog';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { startOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { simpleBudgetCategories } from '@/lib/expense-categories';

export default function BudgetPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedBudget, setSelectedBudget] = React.useState<Budget | null>(null);

  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();
  const triggeredAlerts = useRef<Set<string>>(new Set());

  const budgetsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'budgets') : null),
    [firestore, user]
  );
  const { data: budgetsData, isLoading: budgetsLoading } = useCollection<Budget>(budgetsQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const monthStart = startOfMonth(new Date());
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      where('date', '>=', monthStart)
    );
  }, [firestore, user]);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);

  const budgets = React.useMemo(() => {
    return simpleBudgetCategories.map(category => {
      const budgetConfig = budgetsData?.find(b => b.category === category);
      const spent = expenses
        ?.filter(e => e.category === category)
        .reduce((acc, e) => acc + e.amount, 0) || 0;
      
      return {
        id: budgetConfig?.id || category,
        category: category,
        planned: budgetConfig?.planned ?? 1000,
        spent: spent,
        alertThreshold: budgetConfig?.alertThreshold ?? 80, // Default to 80%
      };
    });
  }, [budgetsData, expenses]);
  
  useEffect(() => {
    budgets.forEach(budget => {
      const { category, planned, spent, alertThreshold } = budget;
      const alertId = `${user?.uid}-${category}`;
      const thresholdAmount = planned * (alertThreshold / 100);

      if (spent >= thresholdAmount && !triggeredAlerts.current.has(alertId)) {
        toast({
          variant: "destructive",
          title: "התראת תקציב",
          description: `חרגת מסף ההתראה (${alertThreshold}%) עבור קטגוריית "${category}".`,
        });
        triggeredAlerts.current.add(alertId);
      } else if (spent < thresholdAmount && triggeredAlerts.current.has(alertId)) {
        // Optional: Reset alert if spending drops below threshold (e.g., due to a returned item)
        triggeredAlerts.current.delete(alertId);
      }
    });
  }, [budgets, toast, user?.uid]);


  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedBudget(null);
  };
  
  const isLoading = isUserLoading || budgetsLoading || expensesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">ניהול תקציב</h2>
          <p className="text-muted-foreground">הגדר יעדים ועקוב אחר ההוצאות שלך בכל קטגוריה.</p>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((budget) => (
            <BudgetCard key={budget.category} budget={budget} onEdit={handleEdit} />
          ))}
        </div>
      )}
       <EditBudgetDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        budget={selectedBudget}
      />
    </div>
  );
}
