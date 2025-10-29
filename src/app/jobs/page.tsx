'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import type { Job } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDocumentNonBlocking } from 'firebase/firestore';
import { JobSelector } from '@/components/jobs/job-selector';
import { JobEditor } from '@/components/jobs/job-editor';
import { useToast } from '@/hooks/use-toast';

export default function JobsPage() {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const { firestore, user, isUserLoading } = useFirebase();
  const { toast } = useToast();

  const jobsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'jobs') : null),
    [firestore, user]
  );
  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(jobsQuery);

  // Effect to select the first job once data is loaded
  React.useEffect(() => {
    if (!selectedJobId && jobs && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = useMemo(() => {
    return jobs?.find(j => j.id === selectedJobId) || null;
  }, [jobs, selectedJobId]);

  const handleAddNew = () => {
     if (!firestore || !user) return;
     const newJobData = {
        name: `עבודה חדשה ${jobs ? jobs.length + 1 : 1}`,
        hourlyRate: 35, // Default rate
        travelRatePerShift: 0,
        overtimeThresholdHours: 8,
        areBreaksPaid: false,
        sickDayPayPercentage: 50,
        sickDayStartDay: 2,
        isEligibleForGrant: false,
     };
     const jobsCol = collection(firestore, 'users', user.uid, 'jobs');
     addDocumentNonBlocking(jobsCol, newJobData).then((docRef) => {
        if (docRef) {
          setSelectedJobId(docRef.id);
          toast({ title: "עבודה חדשה נוצרה", description: "תוכל לערוך את פרטיה כאן." });
        }
     });
  };
  
  const isLoading = isUserLoading || jobsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">ניהול עבודות</h2>
            <p className="text-muted-foreground">הצג, הוסף וערוך את העבודות והתעריפים שלך.</p>
        </div>
        <JobSelector 
          jobs={jobs || []} 
          selectedJobId={selectedJobId} 
          onSelectJob={setSelectedJobId}
          onAddNew={handleAddNew}
          disabled={isLoading}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-96 border rounded-lg bg-card"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : selectedJob ? (
        <JobEditor key={selectedJob.id} job={selectedJob} />
      ) : (
         <div className="flex flex-col justify-center items-center h-96 border-2 border-dashed rounded-lg bg-card text-center p-8">
            <h3 className="text-xl font-semibold">לא נמצאו עבודות</h3>
            <p className="text-muted-foreground mt-2">כדי להתחיל, הוסף את מקום העבודה הראשון שלך.</p>
            <Button onClick={handleAddNew} className="mt-6">
              <PlusCircle className="ms-2 h-4 w-4" />
              הוסף עבודה
            </Button>
        </div>
      )}
    </div>
  );
}
