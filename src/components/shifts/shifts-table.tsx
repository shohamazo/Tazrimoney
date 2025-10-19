'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Shift, Job } from '@/lib/types';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Timestamp, doc, deleteDoc } from 'firebase/firestore';
import { useFirebase } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';

function calculateDuration(start: Date, end: Date) {
    const diff = end.getTime() - start.getTime();
    if (diff <= 0) return '00:00';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function ShiftsTable({ shifts, jobs, onEdit }: { shifts: Shift[], jobs: Job[], onEdit: (shift: Shift) => void }) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const shiftsWithDetails = useMemo(() => {
        return shifts.map(shift => {
            const job = jobs.find(j => j.id === shift.jobId);
            const start = (shift.start as unknown as Timestamp).toDate();
            const end = (shift.end as unknown as Timestamp).toDate();

            const calculateEarnings = (): number => {
                if (!job) return 0;
                const durationInHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                return durationInHours > 0 ? durationInHours * job.hourlyRate : 0;
            }

            return {
                ...shift,
                start,
                end,
                jobName: job?.name || 'Unknown',
                hourlyRate: job?.hourlyRate || 0,
                duration: calculateDuration(start, end),
                earnings: calculateEarnings(),
            }
        });
    }, [shifts, jobs]);

    const handleDelete = async (shiftId: string) => {
        if (!firestore || !user) return;
        const shiftRef = doc(firestore, 'users', user.uid, 'shifts', shiftId);
        deleteDocumentNonBlocking(shiftRef);
        toast({ title: "משמרת נמחקה", description: "המשמרת נמחקה בהצלחה." });
    };

    const formatDate = (date: Date) => date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatTime = (date: Date) => date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>עבודה</TableHead>
                        <TableHead>תאריך</TableHead>
                        <TableHead>שעת התחלה</TableHead>
                        <TableHead>שעת סיום</TableHead>
                        <TableHead>משך</TableHead>
                        <TableHead>תעריף</TableHead>
                        <TableHead>רווח (מוערך)</TableHead>
                        <TableHead className="text-left"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {shiftsWithDetails.map((shift) => (
                        <TableRow key={shift.id}>
                            <TableCell className="font-medium"><Badge variant="secondary">{shift.jobName}</Badge></TableCell>
                            <TableCell>{formatDate(shift.start)}</TableCell>
                            <TableCell>{formatTime(shift.start)}</TableCell>
                            <TableCell>{formatTime(shift.end)}</TableCell>
                            <TableCell>{shift.duration}</TableCell>
                            <TableCell>₪{shift.hourlyRate.toFixed(2)}</TableCell>
                            <TableCell className="text-green-600 font-medium">₪{shift.earnings.toFixed(2)}</TableCell>
                            <TableCell className="text-left">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">פתח תפריט</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(shift)}>
                                            <Pencil className="ms-2 h-4 w-4" />
                                            <span>עריכה</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(shift.id)} className="text-destructive focus:text-destructive">
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
