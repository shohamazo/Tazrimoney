'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { jobs } from '@/lib/data';
import type { Job } from '@/lib/types';

export function JobsList({ onEdit }: { onEdit: (job: Job) => void }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <Card key={job.id}>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>{job.name}</CardTitle>
              <CardDescription>תעריף שעתי</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">פתח תפריט</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(job)}>
                  <Pencil className="ms-2 h-4 w-4" />
                  <span>עריכה</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive focus:text-destructive">
                  <Trash2 className="ms-2 h-4 w-4" />
                  <span>מחיקה</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">₪{job.hourlyRate.toFixed(2)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
