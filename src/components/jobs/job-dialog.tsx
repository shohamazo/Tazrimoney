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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Job } from '@/lib/types';

const jobSchema = z.object({
  name: z.string().min(2, "שם העבודה חייב להכיל לפחות 2 תווים"),
  hourlyRate: z.coerce.number().min(0, "תעריף שעתי חייב להיות מספר חיובי"),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

export function JobDialog({ isOpen, onOpenChange, job }: JobDialogProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (job) {
        reset(job);
      } else {
        reset({ name: '', hourlyRate: 0 });
      }
    }
  }, [job, isOpen, reset]);

  const onSubmit = (data: JobFormData) => {
    console.log(data);
    // In a real app, you would save this data
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{job ? 'עריכת עבודה' : 'הוספת עבודה חדשה'}</DialogTitle>
          <DialogDescription>
            {job ? 'עדכן את פרטי העבודה.' : 'מלא את פרטי העבודה החדשה.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">שם העבודה</Label>
            <Input id="name" {...register('name')} className="col-span-3" />
            {errors.name && <p className="col-span-4 text-red-500 text-xs text-right">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="hourlyRate" className="text-right">תעריף שעתי (₪)</Label>
            <Input id="hourlyRate" type="number" step="0.1" {...register('hourlyRate')} className="col-span-3" />
            {errors.hourlyRate && <p className="col-span-4 text-red-500 text-xs text-right">{errors.hourlyRate.message}</p>}
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
