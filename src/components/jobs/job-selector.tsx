'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, PlusCircle, Briefcase } from 'lucide-react';
import type { Job } from '@/lib/types';
import { cn } from '@/lib/utils';

interface JobSelectorProps {
  jobs: Job[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string) => void;
  onAddNew: () => void;
  disabled?: boolean;
}

export function JobSelector({ jobs, selectedJobId, onSelectJob, onAddNew, disabled }: JobSelectorProps) {
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full md:w-64 justify-between"
          disabled={disabled}
        >
          {selectedJob ? (
            <>
              <Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />
              <span className="truncate flex-1 text-right">{selectedJob.name}</span>
            </>
          ) : (
            'בחר עבודה'
          )}
          <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full md:w-64" align="end">
        {jobs.map((job) => (
          <DropdownMenuItem
            key={job.id}
            onSelect={() => onSelectJob(job.id)}
            className={cn(job.id === selectedJobId && "bg-accent")}
          >
            {job.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onAddNew}>
          <PlusCircle className="ms-2 h-4 w-4" />
          הוסף עבודה חדשה
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
