'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Info, Briefcase, Calendar, Clock, ChevronsRight, ShoppingCart } from 'lucide-react';
import type { Shift, Job } from '@/lib/types';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Timestamp, doc } from 'firebase/firestore';
import { useFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { calculateShiftEarnings, EarningDetails } from '@/lib/calculator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

function calculateDuration(start: Date, end: Date) {
    const diff = end.getTime() - start.getTime();
    if (diff <= 0) return '00:00';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

const formatHours = (hours: number) => hours.toFixed(2);
const formatCurrency = (amount: number) => `₪${amount.toFixed(2)}`;

const CalculationTooltipContent = ({ details }: { details: EarningDetails }) => (
    <div className="p-2 text-xs space-y-1">
        <div className="font-bold text-center mb-2 border-b pb-1">פירוט רווח</div>
        
        {details.regularPay > 0 && <div className="flex justify-between gap-4"><span>תשלום רגיל ({formatHours(details.regularHours)} שעות):</span> <span className="font-mono">{formatCurrency(details.regularPay)}</span></div>}
        
        {details.overtime125Pay > 0 && <div className="flex justify-between gap-4"><span>שעות נוספות 125% ({formatHours(details.overtime125Hours)} שעות):</span> <span className="font-mono">{formatCurrency(details.overtime125Pay)}</span></div>}
        
        {details.overtime150Pay > 0 && <div className="flex justify-between gap-4"><span>שעות נוספות 150% ({formatHours(details.overtime150Hours)} שעות):</span> <span className="font-mono">{formatCurrency(details.overtime150Pay)}</span></div>}
        
        {details.shabbatPay > 0 && <div className="flex justify-between gap-4"><span>שבת ({formatHours(details.shabbatHours)} שעות):</span> <span className="font-mono">{formatCurrency(details.shabbatPay)}</span></div>}
        
        {details.bonusPay > 0 && <div className="flex justify-between gap-4"><span>בונוס:</span> <span className="font-mono">{formatCurrency(details.bonusPay)}</span></div>}

        {details.travelPay > 0 && <div className="flex justify-between gap-4"><span>נסיעות:</span> <span className="font-mono">{formatCurrency(details.travelPay)}</span></div>}

        <div className="font-bold flex justify-between gap-4 border-t pt-1 mt-1"><span>סה״כ:</span> <span className="font-mono">{formatCurrency(details.totalEarnings)}</span></div>
    </div>
);


export function ShiftsTable({ shifts, jobs, onEdit }: { shifts: Shift[], jobs: Job[], onEdit: (shift: Shift) => void }) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const shiftsWithDetails = useMemo(() => {
        const jobsMap = new Map(jobs.map(j => [j.id, j]));
        return shifts.map(shift => {
            const job = jobsMap.get(shift.jobId);
            const start = (shift.start as unknown as Timestamp).toDate();
            const end = (shift.end as unknown as Timestamp).toDate();
            const earningsDetails = calculateShiftEarnings(shift, job);

            return {
                ...shift,
                start,
                end,
                jobName: job?.name || 'Unknown',
                hourlyRate: job?.hourlyRate || 0,
                duration: calculateDuration(start, end),
                earnings: earningsDetails.totalEarnings,
                earningsDetails: earningsDetails,
            }
        });
    }, [shifts, jobs]);

    const handleDelete = (shiftId: string) => {
        if (!firestore || !user) return;
        const shiftRef = doc(firestore, 'users', user.uid, 'shifts', shiftId);
        deleteDocumentNonBlocking(shiftRef);
        toast({ title: "משמרת נמחקה", description: "המשמרת נמחקה בהצלחה." });
    };

    const formatDate = (date: Date) => date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formatTime = (date: Date) => date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    if (isMobile) {
        return (
            <div className="space-y-4">
                {shiftsWithDetails.map(shift => (
                    <Card key={shift.id}>
                         <CardHeader className="flex flex-row items-center justify-between pb-2">
                             <CardTitle className="text-base font-semibold">{shift.jobName}</CardTitle>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">פתח תפריט</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => onEdit(shift)}><Pencil className="ms-2 h-4 w-4" /><span>עריכה</span></DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDelete(shift.id)} className="text-destructive focus:text-destructive"><Trash2 className="ms-2 h-4 w-4" /><span>מחיקה</span></DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                         </CardHeader>
                         <CardContent className="space-y-3 text-sm">
                             <div className="flex items-center text-muted-foreground"><Calendar className="w-4 h-4 ms-2" /><span>{formatDate(shift.start)}</span></div>
                             <div className="flex items-center text-muted-foreground"><Clock className="w-4 h-4 ms-2" /><span>{formatTime(shift.start)}</span><ChevronsRight className="w-4 h-4 mx-1" /><span>{formatTime(shift.end)} ({shift.duration})</span></div>
                              {shift.salesAmount !== undefined && <div className="flex items-center text-muted-foreground"><ShoppingCart className="w-4 h-4 ms-2" /><span>מכירות: {formatCurrency(shift.salesAmount)}</span></div>}

                             <div className="flex items-center justify-between pt-2 border-t">
                                <span className="font-medium">רווח (מוערך):</span>
                                <div className="flex items-center gap-1 text-green-600 font-bold">
                                    <span>{formatCurrency(shift.earnings)}</span>
                                     <Popover>
                                        <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-5 w-5 opacity-60"><Info className="h-4 w-4" /></Button></PopoverTrigger>
                                        <PopoverContent side="top" align="center" className="w-auto z-10"><CalculationTooltipContent details={shift.earningsDetails} /></PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                         </CardContent>
                    </Card>
                ))}
            </div>
        )
    }

    return (
        <div className="w-full rounded-lg border">
            <div className="w-full overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">עבודה</TableHead>
                                <TableHead className="text-right">תאריך</TableHead>
                                <TableHead className="text-right">התחלה</TableHead>
                                <TableHead className="text-right">סיום</TableHead>
                                <TableHead className="text-right">משך</TableHead>
                                <TableHead className="text-right">מכירות</TableHead>
                                <TableHead className="text-right">רווח (מוערך)</TableHead>
                                <TableHead className="text-left"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {shiftsWithDetails.map((shift) => (
                                <TableRow key={shift.id}>
                                    <TableCell className="font-medium whitespace-nowrap"><Badge variant="secondary">{shift.jobName}</Badge></TableCell>
                                    <TableCell className="whitespace-nowrap">{formatDate(shift.start)}</TableCell>
                                    <TableCell>{formatTime(shift.start)}</TableCell>
                                    <TableCell>{formatTime(shift.end)}</TableCell>
                                    <TableCell>{shift.duration}</TableCell>
                                    <TableCell>
                                        {shift.salesAmount !== undefined ? formatCurrency(shift.salesAmount) : '—'}
                                    </TableCell>
                                    <TableCell className="text-green-600 font-medium whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span>{formatCurrency(shift.earnings)}</span>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-50"><Info className="h-4 w-4" /></Button>
                                                </PopoverTrigger>
                                                <PopoverContent side="top" align="center" className="w-auto">
                                                    <CalculationTooltipContent details={shift.earningsDetails} />
                                                </PopoverContent>
                                            </Popover>
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
        </div>
    );
}
