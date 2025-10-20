'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Expense } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { he } from 'date-fns/locale';
import { useFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { expenseCategories, type ExpenseCategory, type ExpenseSubcategory } from '@/lib/expense-categories';

const expenseSchema = z.object({
  description: z.string().min(2, "תיאור חייב להכיל לפחות 2 תווים"),
  amount: z.coerce.number().positive("הסכום חייב להיות מספר חיובי"),
  category: z.string().min(1, "יש לבחור קטגוריה"),
  subcategory: z.string().min(1, "יש לבחור תת-קטגוריה"),
  date: z.date({ required_error: "יש לבחור תאריך" }),
  type: z.enum(['one-time', 'recurring'], { required_error: "יש לבחור סוג" }),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;
type ExpenseType = 'one-time' | 'recurring';

interface ExpenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
  prefilledData?: Partial<Expense> | null;
}

export function ExpenseDialog({ isOpen, onOpenChange, expense, prefilledData }: ExpenseDialogProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { control, register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
  });
  
  const selectedCategoryLabel = watch('category');
  const selectedSubcategoryLabel = watch('subcategory');

  // Smart Frequency Logic
  useEffect(() => {
    if (!selectedCategoryLabel || !selectedSubcategoryLabel) return;
    
    const category: ExpenseCategory | undefined = expenseCategories.find(c => c.label === selectedCategoryLabel);
    if (!category) return;
    
    const subcategory: ExpenseSubcategory | undefined = category.subcategories.find(s => s.label === selectedSubcategoryLabel);

    let frequency: 'Monthly' | 'One-Time' | undefined = undefined;

    // Subcategory frequency takes precedence
    if (subcategory?.defaultFrequency) {
      frequency = subcategory.defaultFrequency;
    } else if (category.defaultFrequency) {
      // Fallback to parent category frequency
      frequency = category.defaultFrequency;
    }
    
    if (frequency) {
        const expenseType: ExpenseType = frequency === 'Monthly' ? 'recurring' : 'one-time';
        setValue('type', expenseType);
    }

  }, [selectedCategoryLabel, selectedSubcategoryLabel, setValue]);


  useEffect(() => {
    if (isOpen) {
      if (expense) {
        reset({...expense, date: (expense.date as unknown as Timestamp).toDate()});
      } else if (prefilledData) {
        const date = prefilledData.date ? (typeof prefilledData.date === 'string' ? parseISO(prefilledData.date) : prefilledData.date) : new Date();
        reset({
          description: prefilledData.description || '',
          amount: prefilledData.amount || 0,
          category: prefilledData.category || '',
          subcategory: prefilledData.subcategory || '',
          date: date as Date,
          type: prefilledData.type || 'one-time',
        });
      } else {
        reset({
          description: '',
          amount: 0,
          category: '',
          subcategory: '',
          date: new Date(),
          type: 'one-time',
        });
      }
    }
  }, [expense, prefilledData, isOpen, reset]);

  const onSubmit = (data: ExpenseFormData) => {
    if (!firestore || !user) return;

    const expenseData = {
        ...data,
        date: Timestamp.fromDate(data.date),
    };

    if (expense) {
        const expenseRef = doc(firestore, 'users', user.uid, 'expenses', expense.id);
        setDocumentNonBlocking(expenseRef, expenseData, { merge: true });
        toast({ title: "הוצאה עודכנה", description: "ההוצאה עודכנה בהצלחה." });
    } else {
        const expensesCol = collection(firestore, 'users', user.uid, 'expenses');
        addDocumentNonBlocking(expensesCol, expenseData);
        toast({ title: "הוצאה נוספה", description: "ההוצאה החדשה נוספה בהצלחה." });
    }
    onOpenChange(false);
  };

  const title = expense ? 'עריכת הוצאה' : prefilledData ? 'אישור פרטי קבלה' : 'הוספת הוצאה חדשה';
  const description = expense ? 'עדכן את פרטי ההוצאה.' : prefilledData ? 'בדוק את הפרטים שחולצו מהקבלה ושמור.' : 'מלא את פרטי ההוצאה החדשה.';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
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
                <Select onValueChange={(value) => {
                    field.onChange(value);
                    setValue('subcategory', ''); // Reset subcategory when category changes
                }} value={field.value} dir="rtl">
                  <SelectTrigger><SelectValue placeholder="בחר קטגוריה" /></SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.label}>{cat.icon} {cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
             <div className="space-y-2">
              <Label>תת-קטגוריה</Label>
              <Controller name="subcategory" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir="rtl" disabled={!selectedCategoryLabel}>
                  <SelectTrigger><SelectValue placeholder="בחר תת-קטגוריה" /></SelectTrigger>
                  <SelectContent>
                      {expenseCategories.find(c => c.label === selectedCategoryLabel)?.subcategories.map(sub => (
                          <SelectItem key={sub.value} value={sub.label}>{sub.label}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )} />
              {errors.subcategory && <p className="text-red-500 text-xs mt-1">{errors.subcategory.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
            <Button type="submit">שמור</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
