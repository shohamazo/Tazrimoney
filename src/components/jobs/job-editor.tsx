'use client';

import React, { useEffect, useTransition, useState } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Job, WeeklySchedule } from '@/lib/types';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { JobSettingCard } from './job-setting-card';
import { Bus, Coffee, Percent, CalendarClock, Loader2, Save, Bell, Award } from 'lucide-react';
import { OvertimeIcon, SickPayIcon } from './job-icons';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklyScheduleEditor } from './weekly-schedule-editor';
import { Button } from '../ui/button';

const dayScheduleSchema = z.object({
    enabled: z.boolean(),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
});

const weeklyScheduleSchema = z.object({
    sunday: dayScheduleSchema,
    monday: dayScheduleSchema,
    tuesday: dayScheduleSchema,
    wednesday: dayScheduleSchema,
    thursday: dayScheduleSchema,
    friday: dayScheduleSchema,
    saturday: dayScheduleSchema,
}).optional();

const jobSchema = z.object({
  name: z.string().min(2, 'שם העבודה חייב להכיל לפחות 2 תווים'),
  hourlyRate: z.coerce.number().min(0, 'תעריף שעתי חייב להיות מספר חיובי'),
  travelRatePerShift: z.coerce.number().min(0).optional().default(0),
  overtimeThresholdHours: z.coerce.number().min(0).optional().default(8),
  areBreaksPaid: z.boolean().optional().default(false),
  sickDayPayPercentage: z.coerce.number().min(0).max(100).optional().default(50),
  sickDayStartDay: z.coerce.number().min(1).optional().default(2),
  isEligibleForBonus: z.boolean().optional().default(false),
  bonusPercentage: z.coerce.number().min(0).max(100).optional().default(0),
  shiftReminderTime: z.coerce.number().optional().default(0),
  weeklySchedule: weeklyScheduleSchema,
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobEditorProps {
  job: Job;
}

const defaultWeeklySchedule: WeeklySchedule = {
  sunday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  monday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  tuesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  wednesday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  thursday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  friday: { enabled: false, startTime: '09:00', endTime: '17:00' },
  saturday: { enabled: false, startTime: '09:00', endTime: '17:00' },
};


export function JobEditor({ job }: JobEditorProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      ...job,
      weeklySchedule: job.weeklySchedule ? { ...defaultWeeklySchedule, ...job.weeklySchedule } : defaultWeeklySchedule,
    },
  });
  
  const formValues = useWatch({ control });
  
  const onSubmit = (data: JobFormData) => {
    if (!firestore || !user) return;
    
    startSavingTransition(() => {
        const jobRef = doc(firestore, 'users', user.uid, 'jobs', job.id);
        const jobData: JobFormData = {
            ...data,
            travelRatePerShift: data.travelRatePerShift || 0,
            overtimeThresholdHours: data.overtimeThresholdHours || 0,
            areBreaksPaid: data.areBreaksPaid || false,
            sickDayPayPercentage: data.sickDayPayPercentage || 0,
            sickDayStartDay: data.sickDayStartDay || 1,
            isEligibleForBonus: data.isEligibleForBonus || false,
            bonusPercentage: data.bonusPercentage || 0,
            shiftReminderTime: data.shiftReminderTime || 0,
        };
        
        setDocumentNonBlocking(jobRef, jobData, { merge: true }).then(() => {
            toast({ title: "השינויים נשמרו" });
            reset(data); // Important to reset dirty state after save
        }).catch(() => {
            toast({ variant: 'destructive', title: "שגיאה", description: "לא ניתן היה לשמור את השינויים."});
        });
    });
  };

  // When the selected job changes, reset the form with the new job's data
  useEffect(() => {
    const fullSchedule = job.weeklySchedule ? { ...defaultWeeklySchedule, ...job.weeklySchedule } : defaultWeeklySchedule;
    reset({ ...job, weeklySchedule: fullSchedule });
  }, [job, reset]);

  
  const getReminderDescription = () => {
    const time = formValues.shiftReminderTime;
    if (time === 0) return 'כבוי';
    if (time && time < 60) return `${time} דקות לפני`;
    if (time === 60) return `שעה לפני`;
    if (time && time > 60) return `${time / 60} שעות לפני`;
    return 'כבוי';
  };


  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative">
      <div className="space-y-6 pb-20"> {/* Add padding-bottom to avoid overlap with sticky button */}
        {/* --- Main Details --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 rounded-lg border bg-card p-4">
                <Label htmlFor="name" className="text-sm font-medium">שם העבודה</Label>
                <Input id="name" {...register('name')} placeholder="לדוגמה: מאבטח" className="text-lg"/>
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

        {/* --- Weekly Schedule --- */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg"><CalendarClock /> מערכת שעות קבועה</CardTitle>
            </CardHeader>
            <CardContent>
                <WeeklyScheduleEditor control={control} />
            </CardContent>
        </Card>
        
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
            
            <JobSettingCard icon={Bell} title="תזכורת למשמרת" description={getReminderDescription()}>
                 <Controller
                    name="shiftReminderTime"
                    control={control}
                    render={({ field }) => (
                    <Select
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={String(field.value ?? 0)}
                        dir="rtl"
                    >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="0">כבוי</SelectItem>
                            <SelectItem value="15">15 דקות לפני</SelectItem>
                            <SelectItem value="30">30 דקות לפני</SelectItem>
                            <SelectItem value="60">שעה לפני</SelectItem>
                            <SelectItem value="120">שעתיים לפני</SelectItem>
                        </SelectContent>
                    </Select>
                    )}
                 />
            </JobSettingCard>
            
            <JobSettingCard icon={Award} title="בונוס / עמלות" description={formValues.isEligibleForBonus ? `זכאי (${formValues.bonusPercentage || 0}%)` : "לא זכאי"}>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <Label htmlFor="isEligibleForBonus" className="flex flex-col space-y-1">
                            <span>זכאות לבונוס</span>
                        </Label>
                        <Controller name="isEligibleForBonus" control={control} render={({ field }) => (
                            <Switch id="isEligibleForBonus" checked={field.value} onCheckedChange={field.onChange} />
                        )}/>
                    </div>
                    {formValues.isEligibleForBonus && (
                        <div className="space-y-2">
                            <Label htmlFor="bonusPercentage">אחוז בונוס (%)</Label>
                            <Input id="bonusPercentage" type="number" {...register('bonusPercentage')} />
                        </div>
                    )}
                </div>
            </JobSettingCard>

        </div>
         <div className="fixed bottom-0 right-0 w-full bg-background/80 backdrop-blur-sm flex justify-end p-4 border-t md:right-auto md:w-[calc(100%-var(--sidebar-width-icon))] group-data-[state=expanded]:md:w-[calc(100%-var(--sidebar-width))] transition-[width] duration-300">
             <Button type="submit" disabled={!isDirty || isSaving}>
                 {isSaving ? <Loader2 className="ms-2 h-4 w-4 animate-spin" /> : <Save className="ms-2 h-4 w-4" />}
                 {isSaving ? 'שומר...' : 'שמור שינויים'}
            </Button>
        </div>
      </div>
    </form>
  );
}
