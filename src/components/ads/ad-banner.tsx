'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import React, { useState } from 'react';

export function AdBanner() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 peer-data-[variant=sidebar]:md:pl-[calc(var(--sidebar-width-icon)+1rem)] peer-data-[state=expanded]:md:pl-[calc(var(--sidebar-width)+1rem)] transition-[padding] duration-300">
        <Card className="w-full bg-muted/80 backdrop-blur-sm text-muted-foreground p-2 pr-10 sm:p-3 sm:pr-12 flex items-center justify-between gap-4 shadow-lg border">
            <div className="flex-1 text-center font-semibold text-sm">
                פרסומת
            </div>
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                onClick={() => setIsOpen(false)}
            >
                <X className="h-4 w-4" />
            </Button>
        </Card>
    </div>
  );
}
