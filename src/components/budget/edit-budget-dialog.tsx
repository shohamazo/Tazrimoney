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
import { useFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const budgetSchema = z.object({
  planned: z.coerce.number().min(0, "התקציב חייב להיות מספר אי-שלילי"),
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
      reset({ planned: budget.planned });
    }
  }, [budget, isOpen, reset]);

  const onSubmit = async (data: BudgetFormData) => {
    if (!budget || !firestore || !user) return;

    const budgetRef = doc(firestore, 'users', user.uid, 'budgets', budget.category);
    const budgetData = {
        category: budget.category,
        planned: data.planned,
    };
    
    try {
        await setDoc(budgetRef, budgetData, { merge: true });
        toast({ title: "תקציב עודכן", description: `התקציב עבור ${budget.category} עודכן.` });
        onOpenChange(false);
    } catch (error) {
        console.error("Error updating budget:", error);
        toast({ variant: "destructive", title: "שגיאה", description: "הייתה בעיה בעדכון התקציב." });
    }
  };

  if (!budget) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>עריכת תקציב עבור "{budget.category}"</DialogTitle>
          <DialogDescription>
            הגדר את סכום התקציב החודשי המתוכנן לקטגוריה זו.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="planned" className="text-right">תקציב מתוכנן (₪)</Label>
            <Input
              id="planned"
              type="number"
              step="10"
              {...register('planned')}
              className="col-span-3"
            />
            {errors.planned && <p className="col-span-4 text-red-500 text-xs text-right">{errors.planned.message}</p>}
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
