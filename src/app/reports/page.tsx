import { ReportView } from "@/components/reports/report-view";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">דוחות כספיים</h2>
        <p className="text-muted-foreground">
          הפק דוחות חודשיים, נתח את ההכנסות וההוצאות, וקבל סיכום חכם בעזרת AI.
        </p>
      </div>
      <ReportView />
    </div>
  );
}
