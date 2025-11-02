'use client';

import { Card } from '@/components/ui/card';
import React, { useEffect } from 'react';

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
  useEffect(() => {
    // This script initializes the ad. It needs to run after the component mounts.
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4 peer-data-[variant=sidebar]:md:pl-[calc(var(--sidebar-width-icon)+1rem)] peer-data-[state=expanded]:md:pl-[calc(var(--sidebar-width)+1rem)] transition-[padding] duration-300">
        <Card className="w-full bg-card p-2 flex items-center justify-center gap-4 shadow-lg border min-h-[60px]">
            {/* 
              This is where the Google Ad will be displayed.
              We are using the direct HTML snippet from AdSense for reliability.
            */}
            <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: adCode }} />
        </Card>
    </div>
  );
}
