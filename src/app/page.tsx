'use client';
import { StatCard } from '@/components/dashboard/stat-card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TrendingDown, TrendingUp, DollarSign, Clock, Loader2 } from 'lucide-react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useMemo } from 'react';
import type { Shift, Expense, Job } from '@/lib/types';
import { startOfMonth, endOfMonth } from 'date-fns';
import { calculateTotalEarningsForShifts } from '@/lib/calculator';

export default function DashboardPage() {
  const { firestore, user, isUserLoading } = useFirebase();

  const jobsQuery = useMemoFirebase(
    () => (firestore && user ? collection(firestore, 'users', user.uid, 'jobs') : null),
    [firestore, user]
  );
  const { data: jobs, isLoading: jobsLoading } = useCollection<Job>(jobsQuery);

  const shiftsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const monthStart = startOfMonth(new Date());
    return query(
      collection(firestore, 'users', user.uid, 'shifts'),
      where('start', '>=', monthStart)
    );
  }, [firestore, user]);
  const { data: shifts, isLoading: shiftsLoading } = useCollection<Shift>(shiftsQuery);
  
  const expensesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    const monthStart = startOfMonth(new Date());
    return query(
      collection(firestore, 'users', user.uid, 'expenses'),
      where('date', '>=', monthStart)
    );
  }, [firestore, user]);
  const { data: expenses, isLoading: expensesLoading } = useCollection<Expense>(expensesQuery);

  const { totalEarnings, daysWorked } = useMemo(() => {
    if (!shifts || !jobs) return { totalEarnings: 0, daysWorked: 0 };
    return calculateTotalEarningsForShifts(shifts, jobs);
  }, [shifts, jobs]);

  const totalSpent = useMemo(() => {
    if (!expenses) return 0;
    return expenses.reduce((acc, expense) => acc + expense.amount, 0);
  }, [expenses]);
  
  const netBalance = totalEarnings - totalSpent;
  
  const isLoading = isUserLoading || jobsLoading || shiftsLoading || expensesLoading;

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="סה״כ הכנסות"
          value={`₪${totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={TrendingUp}
          description="הכנסות brutto החודש"
          color="text-green-500"
        />
        <StatCard
          title="סה״כ הוצאות"
          value={`₪${totalSpent.toLocaleString()}`}
          icon={TrendingDown}
          description="הוצאות החודש"
          color="text-red-500"
        />
        <StatCard
          title="מאזן נטו"
          value={`₪${netBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="הכנסות פחות הוצאות"
          color={netBalance >= 0 ? 'text-green-500' : 'text-red-500'}
        />
        <StatCard
          title="ימי עבודה"
          value={daysWorked.toString()}
          icon={Clock}
          description="ימי עבודה שהוזנו החודש"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <OverviewChart />
        </div>
        <div>
          <RecentActivity shifts={shifts || []} expenses={expenses || []} jobs={jobs || []}/>
        </div>
      </div>
    </div>
  );
}
