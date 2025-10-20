'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import type { Expense } from '@/lib/types';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Timestamp, doc } from 'firebase/firestore';
import { useFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

export function ExpensesTable({ expenses, onEdit }: { expenses: Expense[], onEdit: (expense: Expense) => void }) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();

    const sortedExpenses = useMemo(() => {
        return expenses.map(e => ({...e, date: (e.date as unknown as Timestamp).toDate()}));
    }, [expenses]);

    const handleDelete = (expenseId: string) => {
        if (!firestore || !user) return;
        const expenseRef = doc(firestore, 'users', user.uid, 'expenses', expenseId);
        deleteDocumentNonBlocking(expenseRef);
        toast({ title: "הוצאה נמחקה", description: "ההוצאה נמחקה בהצלחה." });
    };

    const formatDate = (date: Date) => date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>תיאור</TableHead>
                        <TableHead>קטגוריה</TableHead>
                        <TableHead>סכום</TableHead>
                        <TableHead>תאריך</TableHead>
                        <TableHead>סוג</TableHead>
                        <TableHead className="text-left"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedExpenses.map((expense) => (
                        <TableRow key={expense.id}>
                            <TableCell className="font-medium">{expense.description}</TableCell>
                            <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                            <TableCell className="text-red-600 font-medium">₪{expense.amount.toFixed(2)}</TableCell>
                            <TableCell>{formatDate(expense.date)}</TableCell>
                            <TableCell>{expense.type === 'recurring' ? 'חוזרת' : 'חד פעמית'}</TableCell>
                            <TableCell className="text-left">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">פתח תפריט</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(expense)}>
                                            <Pencil className="ms-2 h-4 w-4" />
                                            <span>עריכה</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(expense.id)} className="text-destructive focus:text-destructive">
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
