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
          variant="ghost"
          className="w-full md:w-auto justify-between text-2xl font-bold h-auto p-2"
          disabled={disabled}
        >
          {selectedJob ? (
            <>
              <span className="truncate flex-1 text-right">{selectedJob.name}</span>
            </>
          ) : (
            'בחר עבודה'
          )}
          <ChevronsUpDown className="ml-auto h-5 w-5 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-full md:w-72" align="end">
        {jobs.map((job) => (
          <DropdownMenuItem
            key={job.id}
            onSelect={() => onSelectJob(job.id)}
            className={cn(job.id === selectedJobId && "bg-accent", "flex items-center gap-2")}
          >
             <Briefcase className="h-4 w-4 text-muted-foreground" />
            <span>{job.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onAddNew} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          <span>הוסף עבודה חדשה</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
