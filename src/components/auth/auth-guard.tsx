
'use client';
import { useUser, useFirestore } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useOnboarding } from '@/components/onboarding/onboarding-provider';

const publicRoutes = ['/login', '/verify-email'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { startWizard } = useOnboarding();

  const [isProfileLoading, setProfileLoading] = useState(true);
  
  const isPublicRoute = publicRoutes.includes(pathname);

  // Handle route protection based on auth state
  useEffect(() => {
    if (isUserLoading) return;

    if (user) {
      if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified && pathname !== '/verify-email') {
        router.replace('/verify-email');
      } else if (isPublicRoute) {
        router.replace('/');
      }
    } else if (!isPublicRoute) {
      router.replace('/login');
    }
  }, [user, isUserLoading, pathname, isPublicRoute, router]);

  // Handle user profile fetching and initial onboarding trigger
  useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      if (!isUserLoading) {
        setProfileLoading(false);
      }
      return;
    }

    const userProfileRef = doc(firestore, 'users', user.uid);

    const fetchOrCreateProfile = async () => {
      setProfileLoading(true);
      try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;
          if (!profile.onboardingComplete) {
            startWizard();
          }
        } else {
          // Profile doesn't exist, create it for the new user
          const newProfile: UserProfile = {
            id: user.uid,
            email: user.email || null,
            displayName: user.displayName || user.phoneNumber || null,
            photoURL: user.photoURL || null,
            onboardingComplete: false,
          };
          await setDoc(userProfileRef, newProfile);
          startWizard(); // Trigger wizard for new user
        }
      } catch (error) {
        console.error("Error fetching or creating user profile:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load user profile.' });
      } finally {
        setProfileLoading(false);
      }
    };

    fetchOrCreateProfile();
  }, [user, isUserLoading, firestore, toast, startWizard]);


  const isLoading = isUserLoading || isProfileLoading;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // Handle redirects for unauthenticated users
  if (!user && !isPublicRoute) {
     return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  
  // Handle redirects for logged-in users on public/special routes
  if (user) {
    if (isPublicRoute) {
       return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }
    
     if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified && pathname !== '/verify-email') {
        return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
      }
  }

  // If all checks pass, render the requested page
  // The OnboardingProvider will handle showing the wizard if needed
  return <>{children}</>;
}
