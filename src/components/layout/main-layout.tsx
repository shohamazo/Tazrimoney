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

export function MainLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    // Don't render the main layout on the login page
    if (pathname === '/login') {
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
            <main className={cn('p-4 sm:p-6 lg:p-8')}>
              {children}
            </main>
        </SidebarInset>
        </>
    );
}
