'use client';

import React, { useState, useTransition, useEffect, useCallback, useMemo } from 'react';
import { Loader2, Wand2, ShoppingCart, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, Sector } from 'recharts';
import { useFirebase, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { generateFinancialReport } from '@/ai/flows/generate-financial-report';
import type { Shift, Job, Expense, UserProfile } from '@/lib/types';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { endOfMonth, startOfMonth, subMonths, format, subDays } from 'date-fns';
import { he } from 'date-fns/locale';
import { calculateShiftEarnings } from '@/lib/calculator';
import { UpgradeTierCard } from '../premium/upgrade-tier-card';
import { Button } from '../ui/button';


interface ChartData {
  name: string;
  income: number;
  expenses: number;
}

interface PieChartData {
  name: string;
  value: number;
}

const COLORS = ['#1A237E', '#5C6BC0', '#9FA8DA', '#D1C4E9', '#FFC107', '#FFD54F', '#FFE082'];

const renderActiveShape = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="font-bold">
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 6}
        outerRadius={outerRadius + 10}
        fill={fill}
      />
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{`₪${value.toLocaleString()}`}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {`(${(percent * 100).toFixed(2)}%)`}
      </text>
    </g>
  );
};


export function ReportView() {
  const [isAiPending, startAiTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [pieChartData, setPieChartData] = useState<PieChartData[]>([]);
  const [topExpenses, setTopExpenses] = useState<Expense[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const { firestore, user, userProfile, isUserLoading } = useFirebase();

  const canUseAI = userProfile?.tier === 'basic' || userProfile?.tier === 'pro';
  
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

  const generateNewReport = useCallback(async (currentData: { shifts: Shift[], expenses: Expense[], jobs: Job[] }) => {
    if (!canUseAI || !firestore || !user) return;

    startAiTransition(async () => {
      setError(null);
      setSummary(null);
      try {
         const jobsMap = new Map(currentData.jobs.map(j => [j.id, j]));
         const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
         for (let i = 5; i >= 0; i--) {
            const date = subMonths(new Date(), i);
            const monthKey = format(date, 'yyyy-MM');
            monthlyData[monthKey] = { income: 0, expenses: 0 };
         }
         currentData.shifts.forEach(shift => {
            const shiftDate = (shift.start as Timestamp).toDate();
            const monthKey = format(shiftDate, 'yyyy-MM');
            if (monthlyData[monthKey]) {
            const job = jobsMap.get(shift.jobId);
            monthlyData[monthKey].income += calculateShiftEarnings(shift, job).totalEarnings;
            }
        });
        currentData.expenses.forEach(expense => {
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

        const dataForAI = {
          period: `Last 6 months (${format(reportStartDate, 'MMM yyyy')} - ${format(reportEndDate, 'MMM yyyy')})`,
          monthlyBreakdown: finalChartData,
          rawExpenses: currentData.expenses.map(e => ({
            date: (e.date as Timestamp).toDate().toISOString(),
            amount: e.amount,
            category: e.category,
            description: e.description,
          })),
        };

        const result = await generateFinancialReport({ data: JSON.stringify(dataForAI, null, 2) });
        
        const newSummary = result.summary;
        setSummary(newSummary);

        // Cache the new report
        const userRef = doc(firestore, 'users', user.uid);
        updateDocumentNonBlocking(userRef, {
            cachedReport: newSummary,
            lastReportDate: Timestamp.now(),
        });
        
      } catch (e) {
        console.error("Failed to generate AI summary:", e);
        setError(e instanceof Error ? e.message : "An unexpected error occurred while generating the summary.");
      }
    });
  }, [canUseAI, firestore, user, reportStartDate, reportEndDate]);
  
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

    const expenseByCategory: { [key: string]: number } = {};
    expenses.forEach(expense => {
      const expenseDate = (expense.date as Timestamp).toDate();
      const monthKey = format(expenseDate, 'yyyy-MM');
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].expenses += expense.amount;
      }
      expenseByCategory[expense.category] = (expenseByCategory[expense.category] || 0) + expense.amount;
    });

    const finalChartData = Object.entries(monthlyData).map(([month, data]) => ({
      name: format(new Date(month), 'MMM', { locale: he }),
      income: parseFloat(data.income.toFixed(2)),
      expenses: parseFloat(data.expenses.toFixed(2)),
    }));
    
    setChartData(finalChartData);

    const finalPieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
    setPieChartData(finalPieData);

    const sortedExpenses = [...expenses].sort((a,b) => b.amount - a.amount);
    setTopExpenses(sortedExpenses.slice(0,3));

    // AI Summary Logic with Caching
    if (canUseAI && userProfile) {
        const now = new Date();
        const lastReportDate = userProfile.lastReportDate?.toDate();
        const tier = userProfile.tier;

        let isCacheStale = true; // Assume stale by default
        if(lastReportDate) {
            if (tier === 'pro') {
                isCacheStale = now > subDays(lastReportDate, -1);
            } else if (tier === 'basic') {
                isCacheStale = now > subDays(lastReportDate, -7);
            }
        }
        
        if (userProfile.cachedReport && !isCacheStale) {
             setSummary(userProfile.cachedReport);
        } else {
            generateNewReport({ shifts, expenses, jobs });
        }
    }

  }, [isDataLoading, shifts, expenses, jobs, userProfile, canUseAI, generateNewReport]);


  const onPieEnter = useCallback((_: any, index: number) => {
    setActiveIndex(index);
  }, []);

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
    <div className="grid gap-6 lg:grid-cols-2">
      {canUseAI ? (
        <Card className="lg:col-span-2 bg-primary/5 border-primary/20">
            <CardHeader>
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 className="text-primary"/>
                        סיכום AI
                    </CardTitle>
                    <CardDescription>ניתוח חכם של הפעילות הפיננסית שלך.</CardDescription>
                </div>
                 <Button variant="ghost" size="icon" onClick={() => generateNewReport({shifts: shifts || [], expenses: expenses || [], jobs: jobs || []})} disabled={isAiPending}>
                    <RefreshCw className={`h-4 w-4 ${isAiPending ? 'animate-spin' : ''}`} />
                 </Button>
            </div>
            </CardHeader>
            <CardContent>
            {isAiPending && !summary && (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin"/>
                    <span>מפיק דוח חדש...</span>
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
      ) : (
        <div className="lg:col-span-2">
          <UpgradeTierCard featureName="סיכום וניתוח חכם של הדוחות" />
        </div>
      )}


        <Card>
            <CardHeader>
                <CardTitle>הוצאות לפי קטגוריה</CardTitle>
                <CardDescription>פירוט ההוצאות שלך בחצי השנה האחרונה.</CardDescription>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie
                            activeIndex={activeIndex}
                            activeShape={renderActiveShape}
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            fill="hsl(var(--primary))"
                            dataKey="value"
                            onMouseEnter={onPieEnter}
                        >
                            {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
        
        <Card>
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
         <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>טופ 3 הוצאות גדולות</CardTitle>
                <CardDescription>שלוש ההוצאות הבודדות הגבוהות ביותר בחצי השנה האחרונה.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {topExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-md">
                            <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1 space-y-1">
                             <p className="font-medium">{expense.description}</p>
                             <p className="text-sm text-muted-foreground">{expense.category}</p>
                        </div>
                         <div className="text-right">
                             <p className="font-bold text-lg text-red-500">-₪{expense.amount.toLocaleString()}</p>
                             <p className="text-xs text-muted-foreground">
                                {format((expense.date as Timestamp).toDate(), 'dd/MM/yyyy')}
                             </p>
                         </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
  );
}

    