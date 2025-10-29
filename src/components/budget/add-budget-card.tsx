'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Budget } from '@/lib/types';
import { PlusCircle } from 'lucide-react';
import React from 'react';
import { categoryIcons } from '@/lib/category-icons';
import { Package } from 'lucide-react';

interface AddBudgetCardProps {
  budget: Budget;
  onAdd: (budget: Budget) => void;
}

export function AddBudgetCard({ budget, onAdd }: AddBudgetCardProps) {
  const Icon = categoryIcons[budget.category] || Package;

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Icon className="h-5 w-5 text-muted-foreground" />
          {budget.category}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center flex-1 gap-4">
        <Button variant="outline" onClick={() => onAdd(budget)}>
          <PlusCircle className="ms-2 h-4 w-4" />
          הוסף תקציב
        </Button>
      </CardContent>
    </Card>
  );
}
