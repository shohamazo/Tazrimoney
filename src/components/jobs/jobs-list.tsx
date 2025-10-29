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
import { MoreHorizontal, Pencil, Trash2, Bus, Gift, Hotel } from 'lucide-react';
import type { Job } from '@/lib/types';
import { useFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '../ui/badge';

// This component is no longer in use and will be removed in a future update.
// The new job editor is now on the main jobs page.
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
                        <TableHead>הטבות</TableHead>
                        <TableHead className="text-left w-[50px]"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobs.map((job) => (
                        <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.name}</TableCell>
                            <TableCell>₪{job.hourlyRate.toFixed(2)}</TableCell>
                            <TableCell>
                                <div className="flex gap-2 flex-wrap">
                                    {job.travelRatePerShift && job.travelRatePerShift > 0 && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <Bus className="h-3 w-3" />
                                            נסיעות
                                        </Badge>
                                    )}
                                    {job.sickDayPayPercentage && job.sickDayPayPercentage > 0 && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <Hotel className="h-3 w-3" />
                                            ימי מחלה
                                        </Badge>
                                    )}
                                     {job.isEligibleForGrant && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                            <Gift className="h-3 w-3" />
                                            מענק עבודה
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
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
