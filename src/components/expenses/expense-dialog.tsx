'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Expense } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useFirebase } from '@/firebase';
import { doc, setDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { budgetCategories } from '@/app/budget/page';

const expenseSchema = z.object({
  description: z.string().min(2, "תיאור חייב להכיל לפחות 2 תווים"),
  amount: z.coerce.number().positive("הסכום חייב להיות מספר חיובי"),
  category: z.string().min(1, "יש לבחור קטגוריה"),
  date: z.date({ required_error: "יש לבחור תאריך" }),
  type: z.enum(['one-time', 'recurring'], { required_error: "יש לבחור סוג" }),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

export function ExpenseDialog({ isOpen, onOpenChange, expense }: ExpenseDialogProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (expense) {
        reset({...expense, date: (expense.date as unknown as Timestamp).toDate()});
      } else {
        reset({
          description: '',
          amount: 0,
          category: '',
          date: new Date(),
          type: 'one-time',
        });
      }
    }
  }, [expense, isOpen, reset]);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!firestore || !user) return;

    const expenseData = {
        ...data,
        date: Timestamp.fromDate(data.date),
    };

    try {
        if (expense) {
            const expenseRef = doc(firestore, 'users', user.uid, 'expenses', expense.id);
            await setDoc(expenseRef, expenseData, { merge: true });
            toast({ title: "הוצאה עודכנה", description: "ההוצאה עודכנה בהצלחה." });
        } else {
            const expensesCol = collection(firestore, 'users', user.uid, 'expenses');
            await addDoc(expensesCol, expenseData);
            toast({ title: "הוצאה נוספה", description: "ההוצאה החדשה נוספה בהצלחה." });
        }
        onOpenChange(false);
    } catch (error) {
        console.error("Error saving expense: ", error);
        toast({ variant: "destructive", title: "שגיאה", description: "הייתה בעיה בשמירת ההוצאה." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? 'עריכת הוצאה' : 'הוספת הוצאה חדשה'}</DialogTitle>
          <DialogDescription>{expense ? 'עדכן את פרטי ההוצאה.' : 'מלא את פרטי ההוצאה החדשה.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="description">תיאור</Label>
            <Input id="description" {...register('description')} />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">סכום (₪)</Label>
            <Input id="amount" type="number" step="0.01" {...register('amount')} />
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>קטגוריה</Label>
              <Controller name="category" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                  <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                  <SelectContent>{budgetCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent>
                </Select>
              )} />
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>סוג</Label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                  <SelectTrigger><SelectValue placeholder="בחר סוג" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one-time">חד פעמית</SelectItem>
                    <SelectItem value="recurring">חוזרת</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label>תאריך</Label>
            <Controller name="date" control={control} render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant={"outline"} className={cn("w-full justify-start text-right font-normal", !field.value && "text-muted-foreground")}>
                    <CalendarIcon className="ms-2 h-4 w-4" />
                    {field.value ? format(field.value, 'PPP', { locale: he }) : <span>בחר תאריך</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={he} /></PopoverContent>
              </Popover>
            )} />
            {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
            <Button type="submit">שמור</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
