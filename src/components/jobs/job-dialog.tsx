'use client';

import React, { useEffect, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { JobSettingCard } from './job-setting-card';
import { Bus, Clock, Coffee, Gift, Smile, Percent, CalendarDays } from 'lucide-react';
import { OvertimeIcon, SickPayIcon } from './job-icons';

const jobSchema = z.object({
  name: z.string().min(2, 'שם העבודה חייב להכיל לפחות 2 תווים'),
  hourlyRate: z.coerce.number().min(0, 'תעריף שעתי חייב להיות מספר חיובי'),
  travelRatePerShift: z.coerce.number().min(0).optional().default(0),
  overtimeThresholdHours: z.coerce.number().min(0).optional().default(8),
  areBreaksPaid: z.boolean().optional().default(false),
  sickDayPayPercentage: z.coerce.number().min(0).max(100).optional().default(50),
  sickDayStartDay: z.coerce.number().min(1).optional().default(2),
  isEligibleForGrant: z.boolean().optional().default(false),
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
    watch,
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

  const formValues = watch();

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
    
    const jobData: JobFormData = {
        ...data,
        travelRatePerShift: data.travelRatePerShift || 0,
        overtimeThresholdHours: data.overtimeThresholdHours || 0,
        areBreaksPaid: data.areBreaksPaid || false,
        sickDayPayPercentage: data.sickDayPayPercentage || 0,
        sickDayStartDay: data.sickDayStartDay || 1,
        isEligibleForGrant: data.isEligibleForGrant || false,
    };

    if (job) {
      const jobRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
      setDocumentNonBlocking(jobRef, jobData, { merge: true });
      toast({ title: 'עבודה עודכנה', description: 'פרטי העבודה עודכנו בהצלחה.' });
    } else {
      const jobsCol = collection(firestore, 'users', user.uid, 'jobs');
      addDocumentNonBlocking(jobsCol, jobData);
      toast({ title: 'עבודה נוספה', description: 'העבודה החדשה נוספה בהצלחה.' });
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{job ? 'עריכת עבודה' : 'הוספת עבודה חדשה'}</DialogTitle>
          <DialogDescription>
            {job ? 'עדכן את פרטי העבודה.' : 'מלא את פרטי העבודה החדשה.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto px-1">
                {/* --- Main Details --- */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">שם העבודה</Label>
                        <Input id="name" {...register('name')} placeholder="לדוגמה: מאבטח"/>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>
                     <JobSettingCard 
                        icon={Percent} 
                        title="תעריף שעתי"
                        description="התעריף הבסיסי שלך לשעה"
                        >
                        <div className="flex items-center gap-2">
                            <Input id="hourlyRate" type="number" step="0.1" {...register('hourlyRate')} className="w-28 text-lg"/>
                            <Label htmlFor="hourlyRate" className="text-lg">₪</Label>
                        </div>
                         {errors.hourlyRate && <p className="text-red-500 text-xs mt-1">{errors.hourlyRate.message}</p>}
                     </JobSettingCard>
                </div>
                
                 {/* --- Settings Grid --- */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <JobSettingCard icon={OvertimeIcon} title="שעות נוספות" description={`לאחר ${formValues.overtimeThresholdHours || 0} שעות`}>
                        <div className="space-y-2">
                            <Label htmlFor="overtimeThresholdHours">יחושב לאחר (שעות)</Label>
                            <Input id="overtimeThresholdHours" type="number" step="0.5" {...register('overtimeThresholdHours')} />
                        </div>
                    </JobSettingCard>

                    <JobSettingCard icon={Bus} title="נסיעות" description={`₪${formValues.travelRatePerShift || 0} למשמרת`}>
                         <div className="space-y-2">
                            <Label htmlFor="travelRatePerShift">החזר נסיעות למשמרת (₪)</Label>
                            <Input id="travelRatePerShift" type="number" step="1" {...register('travelRatePerShift')} />
                        </div>
                    </JobSettingCard>

                    <JobSettingCard icon={Coffee} title="הפסקות" description={formValues.areBreaksPaid ? "בתשלום" : "ללא תשלום"}>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="areBreaksPaid" className="flex flex-col space-y-1">
                                <span>הפסקות בתשלום</span>
                            </Label>
                            <Controller name="areBreaksPaid" control={control} render={({ field }) => (
                                <Switch id="areBreaksPaid" checked={field.value} onCheckedChange={field.onChange} />
                            )}/>
                        </div>
                    </JobSettingCard>
                    
                    <JobSettingCard icon={SickPayIcon} title="ימי מחלה" description={`${formValues.sickDayPayPercentage || 0}% מהיום ה-${formValues.sickDayStartDay || 0}`}>
                        <div className="space-y-4">
                             <div className="space-y-2">
                                <Label htmlFor="sickDayPayPercentage">אחוז תשלום (%)</Label>
                                <Input id="sickDayPayPercentage" type="number" {...register('sickDayPayPercentage')}/>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sickDayStartDay">החל מהיום ה-</Label>
                                <Input id="sickDayStartDay" type="number" {...register('sickDayStartDay')}/>
                            </div>
                        </div>
                    </JobSettingCard>

                    <JobSettingCard icon={CalendarDays} title="תחילת חישוב" description="מתחילת החודש">
                        <div className="text-center text-muted-foreground p-4">
                            <p>הגדרות נוספות יתווספו בעתיד</p>
                        </div>
                    </JobSettingCard>

                    <JobSettingCard icon={Gift} title="מענק עבודה" description={formValues.isEligibleForGrant ? "זכאי" : "לא זכאי"}>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="isEligibleForGrant" className="flex flex-col space-y-1">
                                <span>זכאות למענק</span>
                            </Label>
                             <Controller name="isEligibleForGrant" control={control} render={({ field }) => (
                                <Switch id="isEligibleForGrant" checked={field.value} onCheckedChange={field.onChange} />
                            )}/>
                        </div>
                    </JobSettingCard>
                </div>
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
