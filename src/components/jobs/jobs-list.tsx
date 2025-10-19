'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Job } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function JobsList({ jobs, onEdit }: { jobs: Job[], onEdit: (job: Job) => void }) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const handleDelete = async (jobId: string) => {
        if (!firestore || !user) return;
        const jobRef = doc(firestore, 'users', user.uid, 'jobs', jobId);
        try {
            await deleteDoc(jobRef);
            toast({ title: "עבודה נמחקה", description: "העבודה נמחקה בהצלחה." });
        } catch (error) {
            console.error("Error deleting job: ", error);
            toast({ variant: "destructive", title: "שגיאה", description: "הייתה בעיה במחיקת העבודה." });
        }
    };

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
                <DropdownMenuItem onClick={() => handleDelete(job.id)} className="text-destructive focus:text-destructive">
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
