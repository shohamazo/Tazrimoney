'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Budget } from '@/lib/types';
import { Pencil, Utensils, Car, PartyPopper, Home, Receipt, Package, AlertTriangle, RotateCcw } from 'lucide-react';
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
  const [isFlipped, setIsFlipped] = React.useState(false);

  const percentage = budget.planned > 0 ? (budget.spent / budget.planned) * 100 : 0;
  const remaining = budget.planned - budget.spent;
  
  const thresholdExceeded = budget.planned > 0 && percentage >= budget.alertThreshold;
  const nearingThreshold = budget.planned > 0 && percentage >= (budget.alertThreshold - 20) && !thresholdExceeded;
  const overspent = remaining < 0;

  const Icon = categoryIcons[budget.category] || Package;

  let progressColor = "hsl(var(--primary))";
  if (overspent || thresholdExceeded) {
    progressColor = "hsl(var(--destructive))"; // Red
  } else if (nearingThreshold) {
    progressColor = "hsl(var(--accent))"; // Yellow
  }
  
  const handleFlip = (e: React.MouseEvent) => {
    // Prevent flipping when the edit button is clicked
    if ((e.target as HTMLElement).closest('button')) return;
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="perspective">
      <Card className={cn("flex flex-col transform-style-3d transition-transform duration-700", (thresholdExceeded || overspent) && "border-destructive/50", isFlipped && "rotate-y-180")}>
        {/* Front of the card */}
        <div className="backface-hidden w-full h-full">
            <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                {budget.category}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(budget)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1 gap-4 cursor-pointer" onClick={handleFlip}>
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
        </div>

        {/* Back of the card */}
        <div className="backface-hidden w-full h-full absolute top-0 left-0 rotate-y-180">
             <CardHeader className="flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                 {budget.category}
                </CardTitle>
                 <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFlip}>
                    <RotateCcw className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center flex-1 gap-4 text-center cursor-pointer h-full pt-12" onClick={handleFlip}>
                <p className="text-5xl font-bold" style={{ color: progressColor }}>
                    {percentage.toFixed(0)}%
                </p>
                <p className="text-muted-foreground">מהתקציב נוצלו</p>
                 <p className="text-sm">
                    <span className="font-medium">₪{budget.spent.toLocaleString()}</span> מתוך <span className="font-medium">₪{budget.planned.toLocaleString()}</span>
                </p>
            </CardContent>
        </div>
      </Card>
    </div>
  );
}
