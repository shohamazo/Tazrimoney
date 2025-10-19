'use client';

import React, { useState, useTransition, useEffect, useCallback } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { useFirebase } from '@/firebase';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface ChartData {
  name: string;
  income: number;
  expenses: number;
}

export function ReportView() {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { user } = useFirebase();

  const handleGenerateReport = useCallback(() => {
    if (!user) return;
    
    startTransition(async () => {
      setError(null);
      setSummary(null);
      setChartData([]);

      try {
        const token = await user.getIdToken();
        const headers = new Headers();
        headers.append('Authorization', `Bearer ${token}`);
        headers.append('Content-Type', 'application/json');
        
        const response = await fetch('/api/report', {
          method: 'POST',
          headers,
          body: JSON.stringify({}), // Sending an empty body for the POST request
        });

        if (!response.ok) {
           const errorResult = await response.json();
           throw new Error(errorResult.error || `Server error: ${response.statusText}`);
        }
        
        const result = await response.json();

        if (result.error) {
          setError(result.error);
        } else {
          setSummary(result.summary);
          setChartData(result.chartData || []);
        }
      } catch (e) {
        console.error("Failed to generate report:", e);
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("An unexpected error occurred while generating the report.");
        }
      }
    });
  }, [user]);

  useEffect(() => {
    // Automatically generate report when the component mounts and the user is available
    if (user) {
      handleGenerateReport();
    }
  }, [user, handleGenerateReport]);


  return (
    <div className="space-y-6">
      {isPending && (
         <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ms-4">מפיק את הדוח, נא להמתין...</p>
         </div>
      )}

      {error && !isPending && (
        <Alert variant="destructive">
            <AlertTitle>שגיאה</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isPending && !error && (summary || chartData.length > 0) && (
        <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-2 bg-primary/5 border-primary/20">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="text-primary"/>
                    סיכום AI
                </CardTitle>
                <CardDescription>ניתוח חכם של הפעילות הפיננסית שלך ב-6 החודשים האחרונים.</CardDescription>
                </CardHeader>
                <CardContent>
                <p className="whitespace-pre-wrap leading-relaxed">{summary}</p>
                </CardContent>
            </Card>

            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle>הכנסות מול הוצאות</CardTitle>
                    <CardDescription>סקירה חודשית за 6 החודשים האחרונים.</CardDescription>
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
      
      {!isPending && !error && !summary && chartData.length === 0 && (
         <Card>
            <CardHeader>
                <CardTitle>אין נתונים להצגה</CardTitle>
            </CardHeader>
            <CardContent>
                <p>לא נמצאו נתונים כספיים ב-6 החודשים האחרונים כדי להפיק דוח.</p>
                <p>נסה להוסיף משמרות או הוצאות כדי לראות את הדוח שלך.</p>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
