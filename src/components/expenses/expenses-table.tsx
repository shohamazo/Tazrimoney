'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2, Calendar, Wallet } from 'lucide-react';
import type { Expense } from '@/lib/types';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Timestamp, doc } from 'firebase/firestore';
import { useFirebase, deleteDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { categoryIcons } from '@/lib/category-icons';
import { Package } from 'lucide-react';


export function ExpensesTable({ expenses, onEdit }: { expenses: Expense[], onEdit: (expense: Expense) => void }) {
    const { firestore, user } = useFirebase();
    const { toast } = useToast();
    const isMobile = useIsMobile();

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
    const formatCurrency = (amount: number) => `₪${amount.toFixed(2)}`;

    if (isMobile) {
        return (
            <div className="space-y-4">
                {sortedExpenses.map(expense => {
                    const Icon = categoryIcons[expense.category] || Package;
                    return (
                        <Card key={expense.id}>
                             <CardHeader className="flex flex-row items-center justify-between pb-2">
                                 <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                    {expense.description}
                                </CardTitle>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">פתח תפריט</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => onEdit(expense)}><Pencil className="ms-2 h-4 w-4" /><span>עריכה</span></DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(expense.id)} className="text-destructive focus:text-destructive"><Trash2 className="ms-2 h-4 w-4" /><span>מחיקה</span></DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                             </CardHeader>
                             <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                     <div className="flex items-center text-muted-foreground gap-2">
                                        <Badge variant="outline">{expense.category}</Badge>
                                        <span>/</span>
                                        <Badge variant="outline" className="font-light">{expense.subcategory}</Badge>
                                     </div>
                                     <div className="flex items-center text-muted-foreground"><Calendar className="w-4 h-4 ms-2" /><span>{formatDate(expense.date)}</span></div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <span className="text-muted-foreground">{expense.type === 'recurring' ? 'חוזרת' : 'חד פעמית'}</span>
                                    <div className="flex items-center gap-1 text-red-600 font-bold">
                                        <span>{formatCurrency(expense.amount)}</span>
                                        <Wallet className="w-4 h-4" />
                                    </div>
                                </div>
                             </CardContent>
                        </Card>
                    )
                })}
            </div>
        )
    }

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
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                    <Badge variant="outline">{expense.category}</Badge>
                                    <Badge variant="ghost">{expense.subcategory}</Badge>
                                </div>
                            </TableCell>
                            <TableCell className="text-red-600 font-medium">{formatCurrency(expense.amount)}</TableCell>
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
