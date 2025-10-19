'use client';
import { useUser } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Define public and authentication-related routes
const publicRoutes = ['/login', '/verify-email'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isUserLoading) return; // Wait until user state is determined

    const isPublicRoute = publicRoutes.includes(pathname);

    // If user is not logged in, redirect to login page, unless they are already on a public route
    if (!user && !isPublicRoute) {
      router.replace('/login');
      return;
    }

    if (user) {
      // If user is logged in, handle different scenarios
      if (isPublicRoute) {
        // If on a public route, redirect to dashboard
        router.replace('/');
      } else if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified) {
        // If user signed up with email but hasn't verified it, redirect to verification page
        if (pathname !== '/verify-email') {
          router.replace('/verify-email');
        }
      }
    }
  }, [user, isUserLoading, router, pathname]);

  // Show a loading spinner during critical state transitions
  if (
    isUserLoading ||
    (!user && !publicRoutes.includes(pathname)) ||
    (user && publicRoutes.includes(pathname)) ||
    (user && user.providerData.some(p => p.providerId === 'password') && !user.emailVerified && pathname !== '/verify-email')
  ) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // If all checks pass, render the requested page
  return <>{children}</>;
}
