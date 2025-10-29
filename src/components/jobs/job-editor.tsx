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
import { Button } from '@/components/ui/button';
import { JobSettingCard } from './job-setting-card';
import { Bus, Coffee, Gift, Percent, CalendarDays, Loader2, Save, Bell, CalendarClock } from 'lucide-react';
import { OvertimeIcon, SickPayIcon } from './job-icons';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WeeklyScheduleEditor } from './weekly-schedule-editor';


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
  isEligibleForGrant: z.boolean().optional().default(false),
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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
  
  // When the selected job changes, reset the form with the new job's data
  useEffect(() => {
    const fullSchedule = job.weeklySchedule ? { ...defaultWeeklySchedule, ...job.weeklySchedule } : defaultWeeklySchedule;
    reset({ ...job, weeklySchedule: fullSchedule });
    setSaveStatus('idle'); // Reset save status when job changes
  }, [job, reset]);

  // --- Auto-save logic ---
  useEffect(() => {
    if (!isDirty) {
      if(saveStatus === 'saved') {
         // If we just saved, keep the 'saved' status for a bit.
         const timer = setTimeout(() => setSaveStatus('idle'), 2000);
         return () => clearTimeout(timer);
      }
      return;
    };

    setSaveStatus('saving');
    const debounceTimer = setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 1500); // 1.5-second debounce delay

    // Cleanup function to cancel the timer if the user keeps typing
    return () => clearTimeout(debounceTimer);
    
  // We only want to run this effect when formValues or isDirty changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues, isDirty]);


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
            isEligibleForGrant: data.isEligibleForGrant || false,
            shiftReminderTime: data.shiftReminderTime || 0,
        };
        
        setDocumentNonBlocking(jobRef, jobData, { merge: true });
        setSaveStatus('saved');
        reset(data); // This will reset the "dirty" state of the form
    });
  };
  
  const getReminderDescription = () => {
    const time = formValues.shiftReminderTime;
    if (time === 0) return 'כבוי';
    if (time && time < 60) return `${time} דקות לפני`;
    if (time === 60) return `שעה לפני`;
    if (time && time > 60) return `${time / 60} שעות לפני`;
    return 'כבוי';
  };


  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-6">
        <div className="flex justify-end h-6">
            <div className={cn("flex items-center gap-2 text-sm text-muted-foreground transition-opacity", saveStatus !== 'idle' ? 'opacity-100' : 'opacity-0')}>
              {saveStatus === 'saving' && <> <Loader2 className="h-4 w-4 animate-spin"/> <span>שומר...</span></>}
              {saveStatus === 'saved' && <> <Save className="h-4 w-4 text-green-500"/> <span className="text-green-500">נשמר</span></>}
            </div>
        </div>
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
    </form>
  );
}
