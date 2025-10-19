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
  LogIn,
  Loader2,
} from 'lucide-react';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { useFirebase } from '@/firebase';
import { Button } from '../ui/button';
import { initiateAnonymousSignIn } from '@/firebase/non-blocking-login';

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
  const { auth, user, isUserLoading } = useFirebase();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLogin = () => {
    if (auth) {
      initiateAnonymousSignIn(auth);
    }
  };

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

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
              <Link href={item.href} passHref onClick={handleLinkClick}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                  asChild
                  disabled={!user}
                >
                  <div>
                    <item.icon />
                    <span>{item.label}</span>
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </div>

      <SidebarFooter className="mt-auto border-t border-sidebar-border p-2">
        {isUserLoading ? (
            <div className="flex items-center justify-center p-2">
                <Loader2 className="h-6 w-6 animate-spin text-sidebar-foreground" />
            </div>
        ) : user ? (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium text-white">משתמש אנונימי</p>
              <p className="text-xs text-sidebar-foreground">{user.uid.slice(0,10)}...</p>
            </div>
          </div>
        ) : (
            <div className="group-data-[collapsible=icon]:hidden">
                <Button className="w-full" variant="secondary" onClick={handleLogin}>
                    <LogIn className="ms-2" />
                    התחברות
                </Button>
            </div>
        )}
      </SidebarFooter>
    </div>
  );
}
