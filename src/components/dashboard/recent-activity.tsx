import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { shifts, expenses, jobs } from '@/lib/data';
import { Clock, Wallet } from 'lucide-react';

function getJobName(jobId: string) {
    return jobs.find(j => j.id === jobId)?.name || 'Unknown Job';
}

export function RecentActivity() {
    const recentShifts = shifts.slice(0, 2);
    const recentExpenses = expenses.slice(0, 3);
  
    return (
    <Card>
      <CardHeader>
        <CardTitle>פעילות אחרונה</CardTitle>
        <CardDescription>המשמרות וההוצאות האחרונות שלך.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2"><Clock className="size-4" />משמרות אחרונות</h3>
            <div className="space-y-4">
            {recentShifts.map((shift) => (
                <div key={shift.id} className="flex items-center">
                <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-blue-100 dark:bg-blue-900"><Clock className="size-5 text-blue-500" /></AvatarFallback>
                </Avatar>
                <div className="ms-4 space-y-1">
                    <p className="text-sm font-medium leading-none">{getJobName(shift.jobId)}</p>
                    <p className="text-sm text-muted-foreground">{shift.start.toLocaleDateString('he-IL')} - {shift.start.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                </div>
            ))}
            </div>
        </div>
        <div>
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2"><Wallet className="size-4" />הוצאות אחרונות</h3>
            <div className="space-y-4">
                {recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-red-100 dark:bg-red-900"><Wallet className="size-5 text-red-500" /></AvatarFallback>
                    </Avatar>
                    <div className="ms-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{expense.description}</p>
                        <p className="text-sm text-muted-foreground">{expense.category}</p>
                    </div>
                    <div className="ms-auto font-medium text-red-500">-₪{expense.amount.toFixed(2)}</div>
                    </div>
                ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
