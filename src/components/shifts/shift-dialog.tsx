'use client';

import React, { useEffect, useMemo } from 'react';
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
import type { Shift, Job } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format, addHours, setHours, setMinutes, min } from 'date-fns';
import { he } from 'date-fns/locale';
import { useFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

const shiftSchema = z.object({
  jobId: z.string().min(1, "יש לבחור עבודה"),
  startDate: z.date({ required_error: "יש לבחור תאריך התחלה" }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "פורמט שעה לא תקין (HH:mm)"),
  endDate: z.date({ required_error: "יש לבחור תאריך סיום" }),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "פורמט שעה לא תקין (HH:mm)"),
  salesAmount: z.coerce.number().min(0, "סכום המכירות חייב להיות מספר חיובי").optional(),
}).refine(data => {
    const startDateTime = new Date(data.startDate);
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes);

    const endDateTime = new Date(data.endDate);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes);

    return endDateTime > startDateTime;
}, {
    message: "שעת הסיום חייבת להיות אחרי שעת ההתחלה",
    path: ["endTime"],
});

type ShiftFormData = z.infer<typeof shiftSchema>;

interface ShiftDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  shift: Shift | null;
  jobs: Job[];
}

const toDate = (date: Date | Timestamp): Date => {
  return date instanceof Timestamp ? date.toDate() : date;
};

export function ShiftDialog({ isOpen, onOpenChange, shift, jobs }: ShiftDialogProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const {
    control,
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ShiftFormData>({
    resolver: zodResolver(shiftSchema),
  });
  
  const selectedJobId = watch('jobId');
  const selectedJob = useMemo(() => jobs.find(j => j.id === selectedJobId), [selectedJobId, jobs]);
  
  const startDate = watch('startDate');
  const startTime = watch('startTime');

  useEffect(() => {
    if (isOpen) {
      if (shift) {
        // Editing an existing shift
        const start = toDate(shift.start);
        const end = toDate(shift.end);
        reset({
          jobId: shift.jobId,
          startDate: start,
          startTime: format(start, 'HH:mm'),
          endDate: end,
          endTime: format(end, 'HH:mm'),
          salesAmount: shift.salesAmount || 0,
        });
      } else {
        // Adding a new shift - default to today at the current time
        const now = new Date();
        const futureEnd = addHours(now, 7);
        reset({
          jobId: jobs[0]?.id || '',
          startDate: now,
          startTime: format(now, 'HH:mm'),
          endDate: futureEnd,
          endTime: format(futureEnd, 'HH:mm'),
          salesAmount: 0,
        });
      }
    }
  }, [shift, isOpen, reset, jobs]);
  
  // Auto-suggest end time
  useEffect(() => {
    // Only auto-suggest for new shifts, not when editing an existing one,
    // and only if the user hasn't already manually changed the end time.
    if (shift || !isOpen || !startDate || !/^\d{2}:\d{2}$/.test(startTime)) {
        return;
    }
    
    // Combine date and time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const startDateTime = setMinutes(setHours(startDate, startHours), startMinutes);
    
    // Calculate suggested end time
    const suggestedEndDateTime = addHours(startDateTime, 7);
    
    // Cap at 23:00 on the same day
    const capDateTime = setMinutes(setHours(startDate, 23), 0);
    const finalEndDateTime = min([suggestedEndDateTime, capDateTime]);
    
    // Update form values
    setValue('endDate', finalEndDateTime, { shouldDirty: true });
    setValue('endTime', format(finalEndDateTime, 'HH:mm'), { shouldDirty: true });

  }, [startDate, startTime, shift, isOpen, setValue]);

  const onSubmit = (data: ShiftFormData) => {
    if (!firestore || !user) return;

    const startDateTime = new Date(data.startDate);
    const [startHours, startMinutes] = data.startTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    const endDateTime = new Date(data.endDate);
    const [endHours, endMinutes] = data.endTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    const shiftData = {
        jobId: data.jobId,
        start: Timestamp.fromDate(startDateTime),
        end: Timestamp.fromDate(endDateTime),
        salesAmount: data.salesAmount,
    };

    if (shift) {
        const shiftRef = doc(firestore, 'users', user.uid, 'shifts', shift.id);
        setDocumentNonBlocking(shiftRef, shiftData, { merge: true });
        toast({ title: "משמרת עודכנה", description: "המשמרת עודכנה בהצלחה." });
    } else {
        const shiftsCol = collection(firestore, 'users', user.uid, 'shifts');
        addDocumentNonBlocking(shiftsCol, shiftData);
        toast({ title: "משמרת נוספה", description: "המשמרת החדשה נוספה בהצלחה." });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{shift ? 'עריכת משמרת' : 'הוספת משמרת חדשה'}</DialogTitle>
          <DialogDescription>
            {shift ? 'עדכן את פרטי המשמרת.' : 'מלא את פרטי המשמרת החדשה.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="jobId">עבודה</Label>
            <Controller
              name="jobId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value} dir="rtl">
                  <SelectTrigger>
                    <SelectValue placeholder="בחר עבודה" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>{job.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.jobId && <p className="text-red-500 text-xs text-right mt-1">{errors.jobId.message}</p>}
          </div>

          <div className="space-y-2">
             <Label>התחלה</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn("sm:col-span-2 justify-start text-right font-normal", !field.value && "text-muted-foreground")}
                        >
                        <CalendarIcon className="ms-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP', { locale: he }) : <span>בחר תאריך</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={he} />
                    </PopoverContent>
                    </Popover>
                )}
                />
                <Input {...register('startTime')} id="startTime" className="col-span-1" type="time" step="60" />
            </div>
            {errors.startDate && <p className="text-red-500 text-xs text-right mt-1">{errors.startDate.message}</p>}
            {errors.startTime && <p className="text-red-500 text-xs text-right mt-1">{errors.startTime.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label>סיום</Label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                    <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        variant={"outline"}
                        className={cn("sm:col-span-2 justify-start text-right font-normal", !field.value && "text-muted-foreground")}
                        >
                        <CalendarIcon className="ms-2 h-4 w-4" />
                        {field.value ? format(field.value, 'PPP', { locale: he }) : <span>בחר תאריך</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={he} />
                    </PopoverContent>
                    </Popover>
                )}
                />
                <Input {...register('endTime')} id="endTime" className="col-span-1" type="time" step="60" />
            </div>
             {errors.endDate && <p className="text-red-500 text-xs text-right mt-1">{errors.endDate.message}</p>}
             {errors.endTime && <p className="text-red-500 text-xs text-right mt-1">{errors.endTime.message}</p>}
          </div>
          
          {selectedJob?.isEligibleForBonus && (
            <div className="space-y-2">
                <Label htmlFor="salesAmount">סכום מכירות (₪)</Label>
                <Input id="salesAmount" type="number" step="0.01" {...register('salesAmount')} />
                {errors.salesAmount && <p className="text-red-500 text-xs text-right mt-1">{errors.salesAmount.message}</p>}
            </div>
          )}

          <DialogFooter>
             <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
            <Button type="submit">שמור</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
