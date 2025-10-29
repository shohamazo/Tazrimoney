'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface JobSettingCardProps {
  icon: React.ElementType;
  title: string;
  description: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function JobSettingCard({ icon: Icon, title, description, children, className }: JobSettingCardProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
             <Icon className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-2">
         <div className="text-muted-foreground text-sm h-10">{description}</div>
         <div className="mt-auto">
            {children}
         </div>
      </CardContent>
    </Card>
  );
}
