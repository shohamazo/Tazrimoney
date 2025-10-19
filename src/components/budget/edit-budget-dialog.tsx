'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Budget } from '@/lib/types';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const budgetSchema = z.object({
  planned: z.coerce.number().min(0, "התקציב חייב להיות מספר אי-שלילי"),
  alertThreshold: z.coerce.number().min(0, "האחוז חייב להיות חיובי").max(100, "האחוז לא יכול להיות מעל 100"),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

interface EditBudgetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  budget: Budget | null;
}

export function EditBudgetDialog({ isOpen, onOpenChange, budget }: EditBudgetDialogProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
  });

  useEffect(() => {
    if (isOpen && budget) {
      reset({ planned: budget.planned, alertThreshold: budget.alertThreshold });
    }
  }, [budget, isOpen, reset]);

  const onSubmit = (data: BudgetFormData) => {
    if (!budget || !firestore || !user) return;

    const budgetRef = doc(firestore, 'users', user.uid, 'budgets', budget.category);
    const budgetData = {
        category: budget.category,
        planned: data.planned,
        alertThreshold: data.alertThreshold,
    };
    
    setDocumentNonBlocking(budgetRef, budgetData, { merge: true });
    toast({ title: "תקציב עודכן", description: `התקציב עבור ${budget.category} עודכן.` });
    onOpenChange(false);
  };

  if (!budget) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>עריכת תקציב עבור "{budget.category}"</DialogTitle>
          <DialogDescription>
            הגדר את סכום התקציב החודשי ואת אחוז ההתראה.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="planned">תקציב מתוכנן (₪)</Label>
            <Input
              id="planned"
              type="number"
              step="10"
              {...register('planned')}
            />
            {errors.planned && <p className="text-red-500 text-xs">{errors.planned.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="alertThreshold">סף התראה (%)</Label>
            <Input
              id="alertThreshold"
              type="number"
              step="1"
              min="0"
              max="100"
              {...register('alertThreshold')}
            />
            {errors.alertThreshold && <p className="text-red-500 text-xs">{errors.alertThreshold.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
            <Button type="submit">שמור שינויים</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
