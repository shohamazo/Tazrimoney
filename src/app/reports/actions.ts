'use server';

import { summarizeShiftData } from '@/ai/flows/summarize-shift-data';
import type { Shift, Job } from '@/lib/types';
import { z } from 'zod';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';
import { headers } from 'next/headers';

const firebaseConfig = {
  "projectId": "studio-8929750933-770dd",
  "appId": "1:1090555591021:web:295c4f5f754ca66a980264",
  "apiKey": "AIzaSyDewnVL1OzFI1r0TN-2n53el4gJ8XCgNLQ",
  "authDomain": "studio-8929750933-770dd.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "1090555591021"
};


if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const db = getFirestore();
const auth = getAuth();

const actionSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
});

function calculateEarnings(shift: Shift, jobs: Job[]): number {
  const job = jobs.find(j => j.id === shift.jobId);
  if (!job) return 0;
  // @ts-ignore
  const start = shift.start.toDate();
  // @ts-ignore
  const end = shift.end.toDate();
  const durationInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return durationInHours > 0 ? durationInHours * job.hourlyRate : 0;
}

export async function generateReportAction(values: { startDate: Date; endDate: Date }) {
  const headersList = headers();
  const authorization = headersList.get('Authorization');
  const token = authorization?.split('Bearer ')[1];

  let uid;
  if (token) {
    try {
        const decodedToken = await auth.verifyIdToken(token);
        uid = decodedToken.uid;
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return { error: 'Authentication failed' };
    }
  } else {
    return { error: 'Authentication token not found' };
  }

  const validation = actionSchema.safeParse(values);
  if (!validation.success) {
    return { error: 'Invalid input' };
  }

  const { startDate, endDate } = validation.data;
  
  endDate.setHours(23, 59, 59, 999);

  const jobsSnapshot = await db.collection(`users/${uid}/jobs`).get();
  const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];

  const shiftsSnapshot = await db.collection(`users/${uid}/shifts`)
      .where('start', '>=', startDate)
      .where('start', '<=', endDate)
      .get();
      
  const filteredShifts = shiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Shift[];

  if (filteredShifts.length === 0) {
    return { summary: "לא נמצאו משמרות בטווח התאריכים שנבחר." };
  }

  const shiftDataForAI = filteredShifts.map((shift) => {
    const job = jobs.find((j) => j.id === shift.jobId);
    // @ts-ignore
    const startTime = shift.start.toDate().toISOString();
    // @ts-ignore
    const endTime = shift.end.toDate().toISOString();

    return {
      jobName: job?.name || 'Unknown',
      hourlyRate: job?.hourlyRate || 0,
      startTime: startTime,
      endTime: endTime,
      earnings: calculateEarnings(shift, jobs),
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
