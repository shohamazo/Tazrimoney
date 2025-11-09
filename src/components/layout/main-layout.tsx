'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarInset,
} from '@/components/ui/sidebar';
import { AppSidebar } from './sidebar';
import { Header } from './header';
import { cn } from '@/lib/utils';
import { useFirebase } from '@/firebase';
import { AdBanner } from '../ads/ad-banner';

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { userProfile } = useFirebase();
    // Explicitly check if the user is NOT premium. Users without a tier will be treated as free.
    const isFreeTier = userProfile?.tier !== 'premium';
    
    // Don't render the main layout on the login, verification, or upgrade pages
    if (pathname === '/login' || pathname === '/verify-email' || pathname === '/upgrade') {
        return <>{children}</>;
    }

    return (
        <>
        <Sidebar side="right" variant="sidebar" collapsible="icon">
            <SidebarContent>
            <AppSidebar />
            </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <Header />
            <main className={cn('p-4 sm:p-6 lg:p-8', isFreeTier && 'pb-24')}>
              {children}
            </main>
            {isFreeTier && <AdBanner />}
        </SidebarInset>
        </>
    );
}
