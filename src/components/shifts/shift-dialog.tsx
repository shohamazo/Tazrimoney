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
import type { Shift, Job } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
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
    formState: { errors },
  } = useForm<ShiftFormData>({
    resolver: zodResolver(shiftSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (shift) {
        const start = toDate(shift.start);
        const end = toDate(shift.end);
        reset({
          jobId: shift.jobId,
          startDate: start,
          startTime: format(start, 'HH:mm'),
          endDate: end,
          endTime: format(end, 'HH:mm'),
        });
      } else {
        reset({
          jobId: '',
          startDate: new Date(),
          startTime: format(new Date(), 'HH:mm'),
          endDate: new Date(),
          endTime: format(new Date(new Date().getTime() + 8 * 60 * 60 * 1000), 'HH:mm'),
        });
      }
    }
  }, [shift, isOpen, reset]);

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

          <DialogFooter>
             <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>ביטול</Button>
            <Button type="submit">שמור</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
