'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowDown, Hourglass } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import type { Job } from '@/lib/types';
import { collection } from 'firebase/firestore';

export default function CalculatorPage() {
  const { firestore, user, isUserLoading } = useFirebase();
  const [itemCost, setItemCost] = useState<number | ''>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [calculatedHours, setCalculatedHours] = useState<number | null>(null);

  const jobsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'jobs') : null),
    [firestore, user]
  );
  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(jobsQuery);

  // Set default job when jobs load
  React.useEffect(() => {
    if (jobs && jobs.length > 0 && !selectedJobId) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = useMemo(() => {
    return jobs?.find(j => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  const handleCalculate = () => {
    if (selectedJob && itemCost) {
      const hours = itemCost / selectedJob.hourlyRate;
      setCalculatedHours(hours);
    }
  };

  const isLoading = isUserLoading || jobsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
       <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>נדרש להוסיף עבודה</CardTitle>
          <CardDescription>
            כדי להשתמש במחשבון, עליך להגדיר לפחות עבודה אחת עם תעריף שעתי.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex justify-center items-start pt-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>מחשבון עלות-עבודה</CardTitle>
          <CardDescription>גלה כמה שעות עבודה שווה המוצר שאתה רוצה לקנות.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="itemCost">עלות המוצר (₪)</Label>
            <Input
              id="itemCost"
              type="number"
              placeholder="לדוגמה: 400"
              value={itemCost}
              onChange={(e) => setItemCost(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job">לפי איזו עבודה לחשב?</Label>
            <Select onValueChange={setSelectedJobId} value={selectedJobId} dir="rtl">
              <SelectTrigger id="job">
                <SelectValue placeholder="בחר עבודה..." />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.name} (₪{job.hourlyRate}/שעה)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleCalculate} className="w-full" disabled={!itemCost || !selectedJobId}>
            <ArrowDown className="ms-2 h-4 w-4"/>
            חשב
          </Button>

          {calculatedHours !== null && (
            <Card className="bg-muted/50 text-center">
              <CardContent className="p-6">
                <Hourglass className="mx-auto h-12 w-12 text-primary mb-4" />
                <p className="text-muted-foreground">כדי לממן את הרכישה, תצטרך לעבוד:</p>
                <p className="text-4xl font-bold text-primary mt-2">
                  {calculatedHours.toFixed(1)}
                  <span className="text-xl font-medium ms-1">שעות</span>
                </p>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
