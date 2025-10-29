'use client';

import React, { useEffect, useTransition, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Job } from '@/lib/types';
import { useFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { JobSettingCard } from './job-setting-card';
import { Bus, Coffee, Gift, Percent, CalendarDays, Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { OvertimeIcon, SickPayIcon } from './job-icons';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';


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

interface JobEditorProps {
  job: Job;
  onDelete: (jobId: string) => void;
}

export function JobEditor({ job, onDelete }: JobEditorProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [isSaving, startSavingTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isDirty },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: job,
  });
  
  const formValues = watch();
  
  // When the selected job changes, reset the form with the new job's data
  useEffect(() => {
    reset(job);
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
        };
        
        setDocumentNonBlocking(jobRef, jobData, { merge: true });
        setSaveStatus('saved');
        reset(data); // This will reset the "dirty" state of the form
    });
  };

  const handleDelete = () => {
    onDelete(job.id);
  }

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

        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> אזור מסוכן</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
              <div>
                  <p className="font-medium">מחק עבודה זו</p>
                  <p className="text-sm text-muted-foreground">פעולה זו תמחק את העבודה לצמיתות. לא ניתן לשחזר.</p>
              </div>
              <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive"><Trash2 className="ms-2" /> מחק עבודה</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                          <AlertDialogDescription>
                              פעולה זו תמחק את העבודה "{job.name}" לצמיתות.
                              כדי לאשר, הקלד "{job.name}" בתיבה למטה.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <Input 
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder={job.name}
                      />
                      <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>ביטול</AlertDialogCancel>
                          <AlertDialogAction 
                              onClick={handleDelete}
                              disabled={deleteConfirmation !== job.name}
                          >
                               אני מבין, מחק
                          </AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
