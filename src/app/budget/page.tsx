'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle } from 'lucide-react';
import { BudgetCard } from '@/components/budget/budget-card';
import type { Budget } from '@/lib/types';
import { EditBudgetDialog } from '@/components/budget/edit-budget-dialog';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { startOfMonth } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { simpleBudgetCategories } from '@/lib/expense-categories';
import { AddBudgetDialog } from '@/components/budget/add-budget-dialog';

export default function BudgetPage() {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

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
        triggeredAlerts.current.delete(alertId);
      }
    });
  }, [activeBudgets, toast, user?.uid]);


  const handleEdit = (budget: Budget) => {
    setSelectedBudget(budget);
    setEditDialogOpen(true);
  };

  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
  }
  
  const handleCategorySelected = (category: string) => {
    const budgetToAdd = inactiveBudgets.find(b => b.category === category);
    if (budgetToAdd) {
        setAddDialogOpen(false);
        // Defer opening the edit dialog to allow the add dialog to close smoothly
        setTimeout(() => {
            handleEdit(budgetToAdd);
        }, 150);
    }
  }

  const handleDialogClose = () => {
    setEditDialogOpen(false);
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
         <Button onClick={handleOpenAddDialog}>
            <PlusCircle className="ms-2 h-4 w-4" />
            הוסף קטגוריית תקציב
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeBudgets.length > 0 ? activeBudgets.map((budget) => (
              <BudgetCard key={budget.category} budget={budget} onEdit={handleEdit} />
            )) : (
              <div className="md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-16">
                <p>עדיין לא הגדרת תקציבים.</p>
                <p>לחץ על "הוסף קטגוריית תקציב" כדי להתחיל.</p>
              </div>
            )}
        </div>
      )}
       <EditBudgetDialog
        isOpen={editDialogOpen}
        onOpenChange={handleDialogClose}
        budget={selectedBudget}
      />
      <AddBudgetDialog
        isOpen={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        inactiveBudgets={inactiveBudgets}
        onCategorySelect={handleCategorySelected}
       />
    </div>
  );
}
