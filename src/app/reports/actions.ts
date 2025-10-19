'use server';

import { summarizeShiftData } from '@/ai/flows/summarize-shift-data';
import { shifts as allShifts, jobs } from '@/lib/data';
import type { Shift } from '@/lib/types';
import { z } from 'zod';

const actionSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

function calculateEarnings(shift: Shift): number {
  const job = jobs.find(j => j.id === shift.jobId);
  if (!job) return 0;
  const durationInHours = (shift.end.getTime() - shift.start.getTime()) / (1000 * 60 * 60);
  return durationInHours > 0 ? durationInHours * job.hourlyRate : 0;
}

export async function generateReportAction(values: { startDate: Date; endDate: Date }) {
  const validation = actionSchema.safeParse(values);
  if (!validation.success) {
    return { error: 'Invalid input' };
  }

  const { startDate, endDate } = validation.data;
  
  // Ensure end of day for endDate
  endDate.setHours(23, 59, 59, 999);

  const filteredShifts = allShifts.filter(
    (shift) => shift.start >= startDate && shift.start <= endDate
  );

  if (filteredShifts.length === 0) {
    return { summary: "לא נמצאו משמרות בטווח התאריכים שנבחר." };
  }

  const shiftDataForAI = filteredShifts.map((shift) => {
    const job = jobs.find((j) => j.id === shift.jobId);
    return {
      jobName: job?.name || 'Unknown',
      hourlyRate: job?.hourlyRate || 0,
      startTime: shift.start.toISOString(),
      endTime: shift.end.toISOString(),
      earnings: calculateEarnings(shift),
    };
  });

  try {
    const result = await summarizeShiftData({
      startDate: startDate.toLocaleDateString('en-CA'),
      endDate: endDate.toLocaleDateString('en-CA'),
      shiftData: JSON.stringify(shiftDataForAI, null, 2),
    });

    return { summary: result.summary };
  } catch (error) {
    console.error('AI summary generation failed:', error);
    return { error: 'An error occurred while generating the AI summary.' };
  }
}
