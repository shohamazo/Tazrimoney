'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

const pageTitles: { [key: string]: string } = {
  '/': 'לוח בקרה',
  '/shifts': 'ניהול משמרות',
  '/expenses': 'מעקב הוצאות',
  '/budget': 'ניהול תקציב',
  '/jobs': 'ניהול עבודות',
  '/reports': 'דוחות כספיים',
};

export function Header() {
  const pathname = usePathname();
  const title = pageTitles[pathname] || 'Tazrimony';

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <h1 className="text-xl font-semibold">{title}</h1>
      {/* Add other header items like user menu or actions here */}
    </header>
  );
}
