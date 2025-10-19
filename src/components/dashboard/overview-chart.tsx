'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const data = [
  { name: 'ינו׳', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'פבר׳', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'מרץ', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'אפר׳', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'מאי', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'יוני', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'יולי', total: 4580 },
  { name: 'אוג׳', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'ספט׳', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'אוק׳', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'נוב׳', total: Math.floor(Math.random() * 5000) + 1000 },
  { name: 'דצמ׳', total: Math.floor(Math.random() * 5000) + 1000 },
];

export function OverviewChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>סקירה כללית</CardTitle>
        <CardDescription>הכנסות חודשיות לשנה האחרונה</CardDescription>
      </CardHeader>
      <CardContent className="ps-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="name"
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              reversed={true}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `₪${value}`}
              orientation="right"
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--accent))', opacity: 0.2 }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                direction: 'rtl',
              }}
            />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
