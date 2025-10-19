'use server';

import { generateFinancialReport } from '@/ai/flows/generate-financial-report';
import type { Shift, Job, Expense } from '@/lib/types';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps } from 'firebase-admin/app';
import { headers } from 'next/headers';
import { endOfMonth, startOfMonth, subMonths, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { calculateShiftEarnings } from '@/lib/calculator';

// This is a temporary solution for server-side Firebase initialization.
// In a real-world scenario, you would use service account keys securely.
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

export async function generateReportAction(values: any) {
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

  const today = new Date();
  const endDate = endOfMonth(today);
  const startDate = startOfMonth(subMonths(today, 5)); // 6 months including current

  // Fetch all necessary data
  const jobsSnapshot = await db.collection(`users/${uid}/jobs`).get();
  const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];
  const jobsMap = new Map(jobs.map(j => [j.id, j]));

  const shiftsSnapshot = await db.collection(`users/${uid}/shifts`)
      .where('start', '>=', startDate)
      .where('start', '<=', endDate)
      .get();
  const shifts = shiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Shift[];

  const expensesSnapshot = await db.collection(`users/${uid}/expenses`)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .get();
  const expenses = expensesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[];

  if (shifts.length === 0 && expenses.length === 0) {
    return { summary: "לא נמצאו נתונים כספיים ב-6 החודשים האחרונים.", chartData: [] };
  }

  const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

  for (let i = 5; i >= 0; i--) {
    const date = subMonths(today, i);
    const monthKey = format(date, 'yyyy-MM');
    monthlyData[monthKey] = { income: 0, expenses: 0 };
  }

  shifts.forEach(shift => {
    // @ts-ignore
    const monthKey = format(shift.start.toDate(), 'yyyy-MM');
    if (monthlyData[monthKey]) {
      const job = jobsMap.get(shift.jobId);
      monthlyData[monthKey].income += calculateShiftEarnings(shift, job).totalEarnings;
    }
  });

  expenses.forEach(expense => {
    // @ts-ignore
    const monthKey = format(expense.date.toDate(), 'yyyy-MM');
    if (monthlyData[monthKey]) {
      monthlyData[monthKey].expenses += expense.amount;
    }
  });

  const chartData = Object.entries(monthlyData).map(([month, data]) => ({
    name: format(new Date(month), 'MMM', { locale: he }),
    income: data.income,
    expenses: data.expenses,
  }));


  const dataForAI = {
      period: `Last 6 months (${format(startDate, 'MMM yyyy')} - ${format(endDate, 'MMM yyyy')})`,
      monthlyBreakdown: chartData,
      rawExpenses: expenses.map(e => ({ 
        // @ts-ignore
        date: e.date.toDate().toISOString(), 
        amount: e.amount, 
        category: e.category,
        description: e.description,
      })),
  };

  try {
    const result = await generateFinancialReport({
      data: JSON.stringify(dataForAI, null, 2),
    });

    return { summary: result.summary, chartData: chartData };
  } catch (error) {
    console.error('AI summary generation failed:', error);
    return { error: 'An error occurred while generating the AI summary.' };
  }
}
