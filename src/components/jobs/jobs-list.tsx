'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Job } from '@/lib/types';
import { useFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function JobsList({ jobs, onEdit }: { jobs: Job[], onEdit: (job: Job) => void }) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const handleDelete = (jobId: string) => {
        if (!firestore || !user) return;
        const jobRef = doc(firestore, 'users', user.uid, 'jobs', jobId);
        deleteDocumentNonBlocking(jobRef);
        toast({ title: "עבודה נמחקה", description: "העבודה נמחקה בהצלחה." });
    };

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>שם העבודה</TableHead>
                        <TableHead>תעריף שעתי</TableHead>
                        <TableHead className="text-left w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobs.map((job) => (
                        <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.name}</TableCell>
                            <TableCell>₪{job.hourlyRate.toFixed(2)}</TableCell>
                            <TableCell className="text-left">
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
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
