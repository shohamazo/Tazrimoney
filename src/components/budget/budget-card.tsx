import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Budget } from '@/lib/types';
import { Pencil, Utensils, Car, PartyPopper, Home, Receipt, Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CircularProgress } from './circular-progress';
import React from 'react';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
}

const categoryIcons: { [key: string]: React.ElementType } = {
    'אוכל': Utensils,
    'תחבורה': Car,
    'בילויים': PartyPopper,
    'שכר דירה': Home,
    'חשבונות': Receipt,
    'אחר': Package,
};


export function BudgetCard({ budget, onEdit }: BudgetCardProps) {
  const percentage = budget.planned > 0 ? (budget.spent / budget.planned) * 100 : 0;
  const remaining = budget.planned - budget.spent;
  
  const thresholdExceeded = budget.planned > 0 && percentage >= budget.alertThreshold;
  const overspent = remaining < 0;

  const Icon = categoryIcons[budget.category] || Package;

  let progressColor = "hsl(var(--primary))";
  if (thresholdExceeded) {
    progressColor = "hsl(var(--destructive))";
  }
  if(overspent) {
    progressColor = "hsl(var(--destructive))";
  }


  return (
    <Card className={cn("flex flex-col", (thresholdExceeded || overspent) && "border-destructive/50")}>
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          {budget.category}
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(budget)}>
            <Pencil className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center flex-1 gap-4">
        <div className="relative">
          <CircularProgress progress={percentage} color={progressColor} />
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="h-8 w-8" style={{ color: progressColor }} />
          </div>
        </div>
        <div className="text-center">
            {overspent ? (
                <p className="text-xl font-bold text-destructive">
                    חריגה של ₪{Math.abs(remaining).toLocaleString()}
                </p>
            ) : (
                <p className="text-2xl font-bold">₪{remaining.toLocaleString()}</p>
            )}
            <p className="text-xs text-muted-foreground">נשאר</p>
        </div>
        {thresholdExceeded && !overspent && (
             <div className="flex items-center text-sm text-destructive">
                <AlertTriangle className="h-4 w-4 me-2" />
                <span>מעל סף ההתראה</span>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
