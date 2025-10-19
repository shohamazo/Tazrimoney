'use client';

import React, { useState, useTransition, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { generateFinancialReport } from '@/ai/flows/generate-financial-report';
import type { Shift, Job, Expense } from '@/lib/types';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { endOfMonth, startOfMonth, subMonths, format } from 'date-fns';
import { he } from 'date-fns/locale';
import { calculateShiftEarnings } from '@/lib/calculator';


interface ChartData {
  name: string;
  income: number;
  expenses: number;
}

export function ReportView() {
  const [isAiPending, startAiTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { firestore, user, isUserLoading } = useFirebase();

  // 1. Fetch all necessary data for the last 6 months
  const reportStartDate = useMemo(() => startOfMonth(subMonths(new Date(), 5)), []);
  const reportEndDate = useMemo(() => endOfMonth(new Date()), []);

  const jobsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'jobs') : null),
    [firestore, user]
  );
  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(jobsQuery);

  const shiftsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'shifts'),
      where('start', '>=', reportStartDate),
      where('start', '<=', reportEndDate)
    );
  }, [firestore, user, reportStartDate, reportEndDate]);
  const { data: shifts, isLoading: shiftsLoading } = useCollection<Shift>(shiftsQuery);

  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      where('date', '>=', reportStartDate),
      where('date', '<=', reportEndDate)
    );
  }, [firestore, user, reportStartDate, reportEndDate]);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);

  const isDataLoading = isUserLoading || jobsLoading || shiftsLoading || expensesLoading;

  // 2. Process data for charts as soon as it's loaded
  useEffect(() => {
    if (isDataLoading || !shifts || !expenses || !jobs) return;
     if (shifts.length === 0 && expenses.length === 0) {
        setChartData([]);
        setSummary("לא נמצאו נתונים כספיים ב-6 החודשים האחרונים.");
        return;
    }

    const jobsMap = new Map(jobs.map(j => [j.id, j]));
    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};

    for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
        const monthKey = format(date, 'yyyy-MM');
        monthlyData[monthKey] = { income: 0, expenses: 0 };
    }

    shifts.forEach(shift => {
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

    const finalChartData = Object.entries(monthlyData).map(([month, data]) => ({
        name: format(new Date(month), 'MMM', { locale: he }),
        income: parseFloat(data.income.toFixed(2)),
        expenses: parseFloat(data.expenses.toFixed(2)),
    }));
    
    setChartData(finalChartData);

  }, [isDataLoading, shifts, expenses, jobs]);


  // 3. Generate AI summary after chart data is ready
  useEffect(() => {
    if (chartData.length === 0 || !expenses) return;

    startAiTransition(async () => {
      setError(null);
      setSummary(null);
      try {
        const dataForAI = {
            period: `Last 6 months (${format(reportStartDate, 'MMM yyyy')} - ${format(reportEndDate, 'MMM yyyy')})`,
            monthlyBreakdown: chartData,
            rawExpenses: expenses.map(e => ({ 
                date: (e.date as Timestamp).toDate().toISOString(), 
                amount: e.amount, 
                category: e.category,
                description: e.description,
            })),
        };

        const result = await generateFinancialReport({
          data: JSON.stringify(dataForAI, null, 2),
        });
        setSummary(result.summary);
      } catch (e) {
        console.error("Failed to generate AI summary:", e);
        setError(e instanceof Error ? e.message : "An unexpected error occurred while generating the summary.");
      }
    });
  }, [chartData, expenses, reportStartDate, reportEndDate]);


  if (isDataLoading) {
     return (
         <div className="flex items-center justify-center p-8 h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ms-4">טוען נתונים...</p>
         </div>
      );
  }

  if (chartData.length === 0 && !isDataLoading) {
    return (
        <Card>
            <CardHeader><CardTitle>אין נתונים להצגה</CardTitle></CardHeader>
            <CardContent>
                <p>לא נמצאו נתונים כספיים ב-6 החודשים האחרונים כדי להפיק דוח.</p>
                <p>נסה להוסיף משמרות או הוצאות כדי לראות את הדוח שלך.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2 bg-primary/5 border-primary/20">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="text-primary"/>
                    סיכום AI
                </CardTitle>
                <CardDescription>ניתוח חכם של הפעילות הפיננסית שלך.</CardDescription>
                </CardHeader>
                <CardContent>
                {isAiPending && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin"/>
                        <span>מפיק תובנות...</span>
                    </div>
                )}
                {error && !isAiPending && (
                    <Alert variant="destructive" className="bg-destructive/10">
                        <AlertTitle>שגיאה בסיכום</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {!isAiPending && summary && (
                    <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
                )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>הכנסות מול הוצאות</CardTitle>
                    <CardDescription>סקירה חודשית ל-6 החודשים האחרונים.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} reversed={true} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} orientation="right" tickFormatter={(value) => `₪${value}`} />
                        <Tooltip
                            cursor={{ fill: "hsl(var(--accent))", opacity: 0.2 }}
                            contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))', direction: 'rtl' }}
                        />
                        <Legend wrapperStyle={{ direction: 'rtl' }} />
                        <Bar dataKey="income" name="הכנסות" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="הוצאות" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
