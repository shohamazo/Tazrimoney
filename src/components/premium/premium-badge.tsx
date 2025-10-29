'use client';

import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

export function PremiumBadge() {
    return (
        <Badge variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xs px-2 py-0.5">
            <Sparkles className="h-3 w-3 me-1" />
            פרימיום
        </Badge>
    );
}
