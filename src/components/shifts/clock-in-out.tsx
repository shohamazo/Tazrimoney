'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Square, Timer } from 'lucide-react';
import type { Job } from '@/lib/types';
import { useFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ActiveShift {
  jobId: string;
  startTime: number; // Store as epoch time
}

export function ClockInOut({ jobs }: { jobs: Job[] }) {
  const [selectedJobId, setSelectedJobId] = useState<string | undefined>(jobs[0]?.id);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  // Load active shift from localStorage on mount
  useEffect(() => {
    try {
      const savedShift = localStorage.getItem('activeShift');
      if (savedShift) {
        const shift: ActiveShift = JSON.parse(savedShift);
        setActiveShift(shift);
        if (shift.jobId) {
            setSelectedJobId(shift.jobId);
        }
      }
    } catch (error) {
      console.error("Failed to parse active shift from localStorage", error);
      localStorage.removeItem('activeShift');
    }
  }, []);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (activeShift) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - activeShift.startTime);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeShift]);

  const handleClockIn = () => {
    if (!selectedJobId) {
      toast({
        variant: 'destructive',
        title: 'לא נבחרה עבודה',
        description: 'יש לבחור עבודה לפני התחלת משמרת.',
      });
      return;
    }
    const newShift: ActiveShift = {
      jobId: selectedJobId,
      startTime: Date.now(),
    };
    setActiveShift(newShift);
    localStorage.setItem('activeShift', JSON.stringify(newShift));
    setElapsedTime(0);
  };

  const handleClockOut = () => {
    if (!activeShift || !firestore || !user) return;

    const endTime = new Date();
    const startTime = new Date(activeShift.startTime);

    const shiftData = {
      jobId: activeShift.jobId,
      start: Timestamp.fromDate(startTime),
      end: Timestamp.fromDate(endTime),
    };

    const shiftsCol = collection(firestore, 'users', user.uid, 'shifts');
    addDocumentNonBlocking(shiftsCol, shiftData);

    toast({
      title: 'משמרת הסתיימה',
      description: 'המשמרת נשמרה בהצלחה.',
    });

    setActiveShift(null);
    localStorage.removeItem('activeShift');
    setElapsedTime(0);
  };

  const formatElapsedTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  const getJobName = (jobId: string | undefined) => {
    if (!jobId) return 'לא נבחרה עבודה';
    return jobs.find(j => j.id === jobId)?.name || 'לא ידוע';
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>שעון נוכחות</CardTitle>
        <CardDescription>התחל וסיים משמרת בלחיצת כפתור.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        {activeShift ? (
          <>
            <div className="flex w-full items-center gap-3 rounded-md bg-secondary p-3 flex-1">
                <Timer className="h-6 w-6 text-primary" />
                <div className="flex-1">
                    <p className="text-sm text-muted-foreground">משמרת פעילה ב: <span className="font-bold text-foreground">{getJobName(activeShift.jobId)}</span></p>
                    <p className="text-2xl font-bold font-mono tracking-wider">{formatElapsedTime(elapsedTime)}</p>
                </div>
            </div>
            <Button onClick={handleClockOut} className="w-full shrink-0 sm:w-auto bg-destructive hover:bg-destructive/90">
              <Square className="ms-2 h-4 w-4" />
              סיום משמרת (Clock Out)
            </Button>
          </>
        ) : (
          <>
            <div className="w-full sm:w-64">
              <Select onValueChange={setSelectedJobId} defaultValue={selectedJobId} dir="rtl">
                <SelectTrigger>
                  <SelectValue placeholder="בחר עבודה" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleClockIn} disabled={!selectedJobId} className="w-full shrink-0 sm:w-auto">
              <Play className="ms-2 h-4 w-4" />
              התחל משמרת (Clock In)
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
