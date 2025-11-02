'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import React, { useState, useEffect } from 'react';

// This is the ad unit code from Google AdSense
const adCode = `
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="ca-pub-9668904483593517"
       data-ad-slot="9944833469"
       data-ad-format="auto"
       data-full-width-responsive="true"></ins>
`;

export function AdBanner() {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // This script initializes the ad. It needs to run after the component mounts.
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);


  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 peer-data-[variant=sidebar]:md:pl-[calc(var(--sidebar-width-icon)+1rem)] peer-data-[state=expanded]:md:pl-[calc(var(--sidebar-width)+1rem)] transition-[padding] duration-300">
        <Card className="w-full bg-card p-2 pr-10 sm:p-3 sm:pr-12 flex items-center justify-center gap-4 shadow-lg border min-h-[60px]">
            {/* 
              This is where the Google Ad will be displayed.
              We are using the direct HTML snippet from AdSense for reliability.
            */}
            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: adCode }} />
            
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
