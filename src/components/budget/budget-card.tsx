import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { Budget } from '@/lib/types';
import { Pencil } from 'lucide-react';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
}

export function BudgetCard({ budget, onEdit }: BudgetCardProps) {
  const percentage = budget.planned > 0 ? (budget.spent / budget.planned) * 100 : 0;
  const remaining = budget.planned - budget.spent;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>{budget.category}</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(budget)}>
                <Pencil className="h-4 w-4" />
            </Button>
        </div>
        <CardDescription>
          הוצאת <span className="font-bold">₪{budget.spent.toLocaleString()}</span> מתוך{' '}
          <span className="font-bold">₪{budget.planned.toLocaleString()}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={percentage} />
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          {remaining >= 0 ? `נשאר לך ₪${remaining.toLocaleString()}` : `חריגה של ₪${Math.abs(remaining).toLocaleString()}`}
        </p>
      </CardFooter>
    </Card>
  );
}
