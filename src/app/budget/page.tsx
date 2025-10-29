'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import { BudgetCard } from '@/components/budget/budget-card';
import type { Budget, Expense } from '@/lib/types';
import { EditBudgetDialog } from '@/components/budget/edit-budget-dialog';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { startOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { simpleBudgetCategories } from '@/lib/expense-categories';
import { AddBudgetCard } from '@/components/budget/add-budget-card';

export default function BudgetPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedBudget, setSelectedBudget] = React.useState<Budget | null>(null);
  const [showInactive, setShowInactive] = useState(false);

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

  const { activeBudgets, inactiveBudgets } = React.useMemo(() => {
    const allBudgets = simpleBudgetCategories.map(category => {
      const budgetConfig = budgetsData?.find(b => b.category === category);
      const spent = expenses
        ?.filter(e => e.category === category)
        .reduce((acc, e) => acc + e.amount, 0) || 0;

      return {
        id: budgetConfig?.id || category,
        category: category,
        // Use a default of 0 for planned if it doesn't exist, to properly categorize inactive budgets
        planned: budgetConfig?.planned ?? 0,
        spent: spent,
        alertThreshold: budgetConfig?.alertThreshold ?? 80,
      };
    });
    
    return {
      activeBudgets: allBudgets.filter(b => b.planned > 0),
      inactiveBudgets: allBudgets.filter(b => b.planned <= 0),
    }
  }, [budgetsData, expenses]);
  
  useEffect(() => {
    activeBudgets.forEach(budget => {
      const { category, planned, spent, alertThreshold } = budget;
      const alertId = `${user?.uid}-${category}`;
      const thresholdAmount = planned * (alertThreshold / 100);

      if (planned > 0 && spent >= thresholdAmount && !triggeredAlerts.current.has(alertId)) {
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
  }, [activeBudgets, toast, user?.uid]);


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
         <Button variant="outline" onClick={() => setShowInactive(!showInactive)}>
            {showInactive ? 'הסתר קטגוריות לא פעילות' : 'הצג קטגוריות לא פעילות'}
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeBudgets.map((budget) => (
              <BudgetCard key={budget.category} budget={budget} onEdit={handleEdit} />
            ))}
          </div>

          {showInactive && (
            <div>
              <h3 className="text-lg font-semibold tracking-tight mt-8 mb-4">קטגוריות לא פעילות</h3>
               <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {inactiveBudgets.map((budget) => (
                    <AddBudgetCard key={budget.category} budget={budget} onAdd={handleEdit} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
       <EditBudgetDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        budget={selectedBudget}
      />
    </div>
  );
}
