'use server';

import { generateFinancialReport } from '@/ai/flows/generate-financial-report';
import type { Shift, Job, Expense } from '@/lib/types';
import { headers } from 'next/headers';
import { endOfMonth, startOfMonth, subMonths, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { calculateShiftEarnings } from '@/lib/calculator';

// Import client SDK components
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// This is a temporary solution for server-side Firebase initialization.
// We are initializing a client-side app on the server to fetch data.
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db = getFirestore(app);

export async function generateReportAction(values: any) {
  const headersList = headers();
  const authorization = headersList.get('Authorization');
  const token = authorization?.split('Bearer ')[1];

  if (!token) {
    return { error: 'Authentication token not found' };
  }
  
  // We'll extract the UID from the token manually for the query path.
  let uid;
  try {
    // The token is a JWT. The payload is the second part, Base64-encoded.
    const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    uid = decodedToken.user_id || decodedToken.sub; // Firebase ID tokens use 'sub' or 'user_id' for the UID.
  } catch (error) {
    console.error('Error decoding token:', error);
    return { error: 'Invalid authentication token.' };
  }
  
  if (!uid) {
    return { error: 'Could not determine user from token.' };
  }


  const today = new Date();
  const endDate = endOfMonth(today);
  const startDate = startOfMonth(subMonths(today, 5)); // 6 months including current

  // Fetch all necessary data using the UID in the path
  const jobsSnapshot = await getDocs(collection(db, `users/${uid}/jobs`));
  const jobs = jobsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];
  const jobsMap = new Map(jobs.map(j => [j.id, j]));

  const shiftsSnapshot = await getDocs(query(
    collection(db, `users/${uid}/shifts`),
    where('start', '>=', startDate),
    where('start', '<=', endDate)
  ));
  const shifts = shiftsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Shift[];

  const expensesSnapshot = await getDocs(query(
      collection(db, `users/${uid}/expenses`),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
  ));
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
    // Client SDK uses Timestamps, which have a toDate() method.
    const shiftDate = (shift.start as Timestamp).toDate();
    const monthKey = format(shiftDate, 'yyyy-MM');
    if (monthlyData[monthKey]) {
      const job = jobsMap.get(shift.jobId);
      monthlyData[monthKey].income += calculateShiftEarnings(shift, job).totalEarnings;
    }
  });

  expenses.forEach(expense => {
    const expenseDate = (expense.date as Timestamp).toDate();
    const monthKey = format(expenseDate, 'yyyy-MM');
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
        date: (e.date as Timestamp).toDate().toISOString(), 
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
    // Gracefully handle AI failure: return the chart data anyway.
    return { summary: "לא ניתן היה ליצור סיכום AI כרגע.", chartData: chartData, error: 'An error occurred while generating the AI summary.' };
  }
}
