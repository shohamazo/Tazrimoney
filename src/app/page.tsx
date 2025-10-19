import { StatCard } from '@/components/dashboard/stat-card';
import { OverviewChart } from '@/components/dashboard/overview-chart';
import { RecentActivity } from '@/components/dashboard/recent-activity';
import { TrendingDown, TrendingUp, DollarSign, Clock } from 'lucide-react';

export default function DashboardPage() {
  // In a real app, these values would come from data fetching and calculations
  const totalEarnings = 4580;
  const totalSpent = 4205;
  const netBalance = totalEarnings - totalSpent;
  const daysWorked = 15;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="סה״כ הכנסות"
          value={`₪${totalEarnings.toLocaleString()}`}
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
          value={`₪${netBalance.toLocaleString()}`}
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
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
