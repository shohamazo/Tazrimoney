'use client';

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface PremiumBadgeProps {
    tier?: 'Basic' | 'Pro';
    className?: string;
}

export function PremiumBadge({ tier = 'Basic', className }: PremiumBadgeProps) {
    const tierColor = tier === 'Pro' 
        ? "bg-purple-600 hover:bg-purple-600/90" 
        : "bg-accent hover:bg-accent/90";

    return (
        <Badge variant="default" className={cn(tierColor, "text-accent-foreground text-xs px-2 py-0.5", className)}>
            <Sparkles className="h-3 w-3 me-1" />
            {tier}
        </Badge>
    );
}
