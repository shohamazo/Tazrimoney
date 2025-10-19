'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { Budget } from '@/lib/types';
import { cn } from '@/lib/utils';
import { categoryIcons } from '@/lib/category-icons';
import Link from 'next/link';
import { Button } from '../ui/button';

interface BudgetAlertsProps {
  budgets: Budget[];
}

export function BudgetAlerts({ budgets }: BudgetAlertsProps) {
  const alertedBudgets = budgets
    .filter(b => b.spent > 0 && b.planned > 0 && (b.spent / b.planned) * 100 >= b.alertThreshold)
    .sort((a, b) => (b.spent / b.planned) - (a.spent / a.planned)); // Sort by highest percentage

  if (alertedBudgets.length === 0) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center bg-background">
        <CardHeader>
            <div className="mx-auto bg-green-100 dark:bg-green-900 rounded-full p-3">
                 <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
        </CardHeader>
        <CardContent>
          <CardTitle>הכל תחת שליטה</CardTitle>
          <CardDescription className="mt-2">
            אף קטגוריה לא חרגה מסף ההתראה שהוגדר. <br/> המשך כך!
          </CardDescription>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="text-destructive" />
          התראות תקציב
        </CardTitle>
        <CardDescription>קטגוריות שחרגו מהתקציב או קרובות אליו.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alertedBudgets.map((budget) => {
          const percentage = (budget.spent / budget.planned) * 100;
          const overspent = percentage > 100;
          const Icon = categoryIcons[budget.category] || AlertTriangle;

          return (
            <div key={budget.category} className="flex items-center gap-4">
              <div className="p-2 bg-muted rounded-md">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <p className="font-medium">{budget.category}</p>
                  <p className={cn("text-sm font-semibold", overspent ? "text-destructive" : "text-amber-600")}>
                    {percentage.toFixed(0)}%
                  </p>
                </div>
                <Progress value={Math.min(percentage, 100)} indicatorClassName={cn(overspent ? "bg-destructive" : "bg-amber-500")} />
                <p className="text-xs text-muted-foreground">
                  נוצלו ₪{budget.spent.toLocaleString()} מתוך ₪{budget.planned.toLocaleString()}
                </p>
              </div>
            </div>
          );
        })}
         <Button variant="link" asChild className="p-0 h-auto">
            <Link href="/budget">
              עבור לניהול תקציב מלא
            </Link>
         </Button>
      </CardContent>
    </Card>
  );
}
