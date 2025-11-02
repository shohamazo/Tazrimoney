'use client';

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
    <div className="w-full p-2 z-40 bg-card border-t">
        <div className="mx-auto w-full max-w-5xl">
            {/* 
              This is where the Google Ad will be displayed.
              We are using the direct HTML snippet from AdSense for reliability.
            */}
            <div className="w-full h-full min-h-[60px] flex items-center justify-center" dangerouslySetInnerHTML={{ __html: adCode }} />
        </div>
    </div>
  );
}
