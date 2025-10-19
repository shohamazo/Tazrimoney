'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { JobsList } from '@/components/jobs/jobs-list';
import { JobDialog } from '@/components/jobs/job-dialog';
import type { Job } from '@/lib/types';

export default function JobsPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedJob, setSelectedJob] = React.useState<Job | null>(null);

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
      <JobsList onEdit={handleEdit} />
      <JobDialog
        isOpen={dialogOpen}
        onOpenChange={handleDialogClose}
        job={selectedJob}
      />
    </div>
  );
}
