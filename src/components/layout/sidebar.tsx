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
  LogOut,
  Loader2,
  Settings,
  Sparkles,
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
import { handleSignOut } from '@/firebase/auth-actions';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { PremiumBadge } from '../premium/premium-badge';


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
  const { user, userProfile, isUserLoading } = useFirebase();
  const { isMobile, setOpenMobile } = useSidebar();

  const isPremium = userProfile?.tier === 'premium';
  const isFreeTier = userProfile?.tier !== 'premium';

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3 p-2">
          <PiggyBank className="size-8 text-accent" />
          <div className="group-data-[collapsible=icon]:hidden">
            <h1 className="font-bold text-lg text-sidebar-foreground">Tazrimoney</h1>
          </div>
        </Link>
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

      <SidebarFooter className="mt-auto border-t border-sidebar-border p-2 space-y-2">
        {isFreeTier && user && (
            <div className="group-data-[collapsible=icon]:hidden">
                <Button asChild className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/upgrade">
                    <Sparkles className="ms-2" />
                    שדרג לפרימיום
                  </Link>
                </Button>
            </div>
        )}
        {isUserLoading ? (
            <div className="flex items-center justify-center p-2">
                <Loader2 className="h-6 w-6 animate-spin text-sidebar-foreground" />
            </div>
        ) : user ? (
          <div className="group-data-[collapsible=icon]:hidden w-full space-y-2">
            <Link href="/settings" className="flex items-center gap-3 p-1 rounded-md hover:bg-sidebar-accent" onClick={handleLinkClick}>
                <Avatar className="h-9 w-9">
                    {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'}/>}
                    <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="truncate flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-sidebar-foreground truncate">{user.displayName || 'משתמש'}</p>
                        {isPremium && <PremiumBadge />}
                    </div>
                    <p className="text-xs text-sidebar-foreground truncate">{user.email}</p>
                </div>
            </Link>
            <Button className="w-full" variant="secondary" size="sm" onClick={handleSignOut}>
                <LogOut className="ms-2" />
                התנתקות
            </Button>
          </div>
        ) : null}
         {user && <div className="hidden group-data-[collapsible=icon]:block">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Avatar className="h-9 w-9 cursor-pointer">
                        {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User'}/>}
                        <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="right" align="center">
                    <DropdownMenuItem asChild>
                       <Link href="/settings">
                        <Settings className="ms-2 h-4 w-4" />
                        <span>הגדרות</span>
                       </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="ms-2 h-4 w-4" />
                        <span>התנתקות</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>}
      </SidebarFooter>
    </div>
  );
}
