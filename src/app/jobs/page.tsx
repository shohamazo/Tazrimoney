'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { JobsList } from '@/components/jobs/jobs-list';
import { JobDialog } from '@/components/jobs/job-dialog';
import type { Job } from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

export default function JobsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);

  const { firestore, user, isUserLoading } = useFirebase();

  const jobsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'jobs') : null),
    [firestore, user]
  );
  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(jobsQuery);

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setDialogOpen(true);
  };

  const handleAddNew = () => {
    setSelectedJob(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedJob(null);
  };
  
  const isLoading = isUserLoading || jobsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-2xl font-bold tracking-tight">ניהול עבודות</h2>
            <p className="text-muted-foreground">הצג, הוסף וערוך את העבודות והתעריפים שלך.</p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusCircle className="ms-2 h-4 w-4" />
          הוסף עבודה
        </Button>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <JobsList jobs={jobs || []} onEdit={handleEdit} />
      )}
      <JobDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        job={selectedJob}
      />
    </div>
  );
}
