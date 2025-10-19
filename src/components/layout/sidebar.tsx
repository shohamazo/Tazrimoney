'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Clock,
  Wallet,
  Briefcase,
  AreaChart,
  Target,
  PiggyBank,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

const navItems = [
  { href: '/', label: 'לוח בקרה', icon: LayoutDashboard },
  { href: '/shifts', label: 'משמרות', icon: Clock },
  { href: '/expenses', label: 'הוצאות', icon: Wallet },
  { href: '/budget', label: 'תקציב', icon: Target },
  { href: '/jobs', label: 'עבודות', icon: Briefcase },
  { href: '/reports', label: 'דוחות', icon: AreaChart },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 p-2">
          <PiggyBank className="size-8 text-sidebar-primary" />
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="font-bold text-lg text-white">Tazrimony</h1>
          </div>
        </div>
      </SidebarHeader>

      <div className="flex-1 overflow-y-auto">
        <SidebarMenu className="p-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} legacyBehavior passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  asChild
                >
                  <a>
                    <item.icon />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>

      <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src="https://picsum.photos/seed/user/40/40" data-ai-hint="person portrait" />
            <AvatarFallback>UN</AvatarFallback>
          </Avatar>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium text-white">משתמש</p>
            <p className="text-xs text-sidebar-foreground">user@example.com</p>
          </div>
        </div>
      </SidebarFooter>
    </div>
  );
}
