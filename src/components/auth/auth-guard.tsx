
'use client';
import { useUser, useFirestore } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useOnboarding } from '@/components/onboarding/onboarding-provider';

const publicRoutes = ['/login'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { startWizard } = useOnboarding();

  const [isProfileLoading, setProfileLoading] = useState(true);
  
  const isPublicRoute = publicRoutes.includes(pathname) || pathname === '/verify-email'; // Keep verify-email public to avoid redirect loops if it's accessed directly

  // Handle route protection based on auth state
  useEffect(() => {
    if (isUserLoading) return;

    if (user) {
      if (isPublicRoute) {
        router.replace('/');
      }
    } else if (!isPublicRoute) {
      router.replace('/login');
    }
  }, [user, isUserLoading, pathname, isPublicRoute, router]);

  // Handle user profile fetching, initial onboarding, and subscription status check
  useEffect(() => {
    if (isUserLoading || !user || !firestore) {
      if (!isUserLoading) {
        setProfileLoading(false);
      }
      return;
    }

    const userProfileRef = doc(firestore, 'users', user.uid);

    const processUserProfile = async () => {
      setProfileLoading(true);
      try {
        const docSnap = await getDoc(userProfileRef);
        
        if (docSnap.exists()) {
          const profile = docSnap.data() as UserProfile;

          // **Subscription Status Check**
          // If user has a paid tier and the subscription end date is in the past,
          // downgrade them to 'free'. This is a safety net for missed webhooks.
          if ((profile.tier === 'basic' || profile.tier === 'pro') && profile.stripeCurrentPeriodEnd) {
             const periodEnd = profile.stripeCurrentPeriodEnd as any;
             let subscriptionEndDate: Date;
             
             if (periodEnd.toDate) { // It's a Firestore Timestamp
                subscriptionEndDate = periodEnd.toDate();
             } else { // It's likely a Date object or a string/number from serialization
                subscriptionEndDate = new Date(periodEnd);
             }


            if (new Date() > subscriptionEndDate) {
              await updateDoc(userProfileRef, {
                tier: 'free',
                stripeSubscriptionId: null,
                stripeCurrentPeriodEnd: null,
              });
              toast({
                title: "המנוי שלך פג",
                description: "הועברת למסלול החינמי.",
              });
              // The profile is now stale, so we can either reload or just let the listener catch up.
              // For simplicity, we'll let the next auth state change refresh the profile.
            }
          }


          // Onboarding check
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
            tier: 'free',
          };
          await setDoc(userProfileRef, newProfile);
          toast({
            title: `חשבון נוצר (Free)`,
            description: "התחלת במסלול החינמי.",
          });
          startWizard(); // Trigger wizard for new user
        }
      } catch (error) {
        console.error("Error fetching or creating user profile:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load user profile.' });
      } finally {
        setProfileLoading(false);
      }
    };

    processUserProfile();
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
  if (user && isPublicRoute) {
     return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  // If all checks pass, render the requested page
  // The OnboardingProvider will handle showing the wizard if needed
  return <>{children}</>;
}
