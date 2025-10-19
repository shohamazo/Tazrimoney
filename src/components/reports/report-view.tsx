'use client';

import React, { useState, useTransition, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2, Wand2 } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, startOfMonth } from 'date-fns';
import { he } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useFirebase } from '@/firebase';

const chartData = [
  { name: 'שבוע 1', income: 1200, expenses: 800 },
  { name: 'שבוע 2', income: 950, expenses: 1100 },
  { name: 'שבוע 3', income: 1500, expenses: 700 },
  { name: 'שבוע 4', income: 1100, expenses: 900 },
];

export function ReportView() {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { auth, user, isUserLoading } = useFirebase();

  const handleGenerateReport = useCallback(() => {
    if (!date?.from || !date?.to || !user) return;
    
    startTransition(async () => {
      setError(null);
      setSummary(null);

      try {
        const token = await user.getIdToken();
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);
        headers.append('Content-Type', 'application/json');
        
        const response = await fetch('/api/report', {
          method: 'POST',
          headers,
          body: JSON.stringify({ startDate: date.from, endDate: date.to }),
        });

        if (!response.ok) {
          throw new Error(`Server error: ${response.statusText}`);
        }
        
        const result = await response.json();

        if (result.error) {
          setError(result.error);
        } else {
          setSummary(result.summary);
        }
      } catch (e) {
        console.error("Failed to generate report:", e);
        setError("An unexpected error occurred while generating the report.");
      }
    });
  }, [date, user]);

  useEffect(() => {
    if (user) {
      handleGenerateReport();
    }
  }, [user, date, handleGenerateReport]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>הפקת דוח</CardTitle>          
          <CardDescription>בחר טווח תאריכים כדי לראות דוח כספי.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
            <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-[300px] justify-start text-right font-normal",
                    !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="ms-2 h-4 w-4" />
                    {date?.from ? (
                    date.to ? (
                        <>
                        {format(date.from, "LLL dd, y", { locale: he })} -{" "}
                        {format(date.to, "LLL dd, y", { locale: he })}
                        </>
                    ) : (
                        format(date.from, "LLL dd, y", { locale: he })
                    )
                    ) : (
                    <span>בחר תאריך</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                    locale={he}
                    disabled={isPending}
                />
                </PopoverContent>
            </Popover>
        </CardContent>
      </Card>
      
      {isPending && (
         <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ms-4">מפיק את הדוח, נא להמתין...</p>
         </div>
      )}

      {error && (
        <Alert variant="destructive">
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {summary && (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="text-primary"/>
                    סיכום AI
                </CardTitle>
                <CardDescription>סיכום וניתוח של התקופה שנבחרה.</CardDescription>
                </CardHeader>
                <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>הכנסות מול הוצאות</CardTitle>
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
      )}

    </div>
  );
}
