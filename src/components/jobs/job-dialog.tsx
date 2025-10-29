'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Job } from '@/lib/types';
import { useFirebase, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const jobSchema = z.object({
  name: z.string().min(2, 'שם העבודה חייב להכיל לפחות 2 תווים'),
  hourlyRate: z.coerce.number().min(0, 'תעריף שעתי חייב להיות מספר חיובי'),
  travelRatePerShift: z.coerce.number().min(0).optional(),
  overtimeThresholdHours: z.coerce.number().min(0).optional(),
  areBreaksPaid: z.boolean().optional(),
  sickDayPayPercentage: z.coerce.number().min(0).max(100).optional(),
  sickDayStartDay: z.coerce.number().min(1).optional(),
  isEligibleForGrant: z.boolean().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

export function JobDialog({ isOpen, onOpenChange, job }: JobDialogProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
        name: '',
        hourlyRate: 0,
        travelRatePerShift: 0,
        overtimeThresholdHours: 8,
        areBreaksPaid: false,
        sickDayPayPercentage: 50,
        sickDayStartDay: 2,
        isEligibleForGrant: false,
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (job) {
        reset(job);
      } else {
        reset({
            name: '',
            hourlyRate: 0,
            travelRatePerShift: 0,
            overtimeThresholdHours: 8,
            areBreaksPaid: false,
            sickDayPayPercentage: 50,
            sickDayStartDay: 2,
            isEligibleForGrant: false,
        });
      }
    }
  }, [job, isOpen, reset]);

  const onSubmit = (data: JobFormData) => {
    if (!firestore || !user) return;

    if (job) {
      const jobRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
      setDocumentNonBlocking(jobRef, data, { merge: true });
      toast({ title: 'עבודה עודכנה', description: 'פרטי העבודה עודכנו בהצלחה.' });
    } else {
      const jobsCol = collection(firestore, 'users', user.uid, 'jobs');
      addDocumentNonBlocking(jobsCol, data);
      toast({ title: 'עבודה נוספה', description: 'העבודה החדשה נוספה בהצלחה.' });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{job ? 'עריכת עבודה' : 'הוספת עבודה חדשה'}</DialogTitle>
          <DialogDescription>
            {job ? 'עדכן את פרטי העבודה.' : 'מלא את פרטי העבודה החדשה.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">שם העבודה</Label>
                        <Input id="name" {...register('name')} />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="hourlyRate">תעריף שעתי (₪)</Label>
                        <Input id="hourlyRate" type="number" step="0.1" {...register('hourlyRate')} />
                        {errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate.message}</p>}
                    </div>
                </div>

                <Separator className="my-2" />
                
                <Accordion type="multiple" className="w-full">
                    <AccordionItem value="overtime">
                        <AccordionTrigger>הגדרות שעות נוספות והפסקות</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="overtimeThresholdHours">שעות נוספות יחושבו לאחר (שעות)</Label>
                                <Input id="overtimeThresholdHours" type="number" step="0.5" {...register('overtimeThresholdHours')} placeholder="לדוגמה: 8" />
                                <p className="text-xs text-muted-foreground">השאר 0 אם אין שעות נוספות. ברירת מחדל היא 8.</p>
                                {errors.overtimeThresholdHours && <p className="text-red-500 text-xs mt-1">{errors.overtimeThresholdHours.message}</p>}
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-3">
                                <Label htmlFor="areBreaksPaid" className="flex flex-col space-y-1">
                                    <span>הפסקות בתשלום</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                    האם הפסקות במהלך המשמרת מחושבות כשעות עבודה?
                                    </span>
                                </Label>
                                <Controller
                                    name="areBreaksPaid"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            id="areBreaksPaid"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="benefits">
                        <AccordionTrigger>הטבות ותנאים</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="travelRatePerShift">החזר נסיעות למשמרת (₪)</Label>
                                <Input id="travelRatePerShift" type="number" step="1" {...register('travelRatePerShift')} />
                                {errors.travelRatePerShift && <p className="text-red-500 text-xs mt-1">{errors.travelRatePerShift.message}</p>}
                            </div>
                             <div className="flex items-center justify-between rounded-lg border p-3">
                                <Label htmlFor="isEligibleForGrant" className="flex flex-col space-y-1">
                                    <span>זכאות למענק עבודה</span>
                                    <span className="font-normal leading-snug text-muted-foreground">
                                    האם עבודה זו מזכה במענק עבודה (מס הכנסה שלילי)?
                                    </span>
                                </Label>
                                 <Controller
                                    name="isEligibleForGrant"
                                    control={control}
                                    render={({ field }) => (
                                        <Switch
                                            id="isEligibleForGrant"
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    )}
                                />
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                    <AccordionItem value="sick-days">
                        <AccordionTrigger>ימי מחלה</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="sickDayPayPercentage">אחוז תשלום עבור יום מחלה (%)</Label>
                                    <Input id="sickDayPayPercentage" type="number" {...register('sickDayPayPercentage')} placeholder="לדוגמה: 50"/>
                                     {errors.sickDayPayPercentage && <p className="text-red-500 text-xs mt-1">{errors.sickDayPayPercentage.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="sickDayStartDay">תשלום ימי מחלה החל מהיום ה-</Label>
                                    <Input id="sickDayStartDay" type="number" {...register('sickDayStartDay')} placeholder="לדוגמה: 2"/>
                                     {errors.sickDayStartDay && <p className="text-red-500 text-xs mt-1">{errors.sickDayStartDay.message}</p>}
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
          </div>
          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              ביטול
            </Button>
            <Button type="submit">שמור</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
