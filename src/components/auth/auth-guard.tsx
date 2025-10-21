
'use client';
import { useUser, useFirestore } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { OnboardingDialog } from '@/components/onboarding/onboarding-dialog';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const publicRoutes = ['/login', '/verify-email'];

// --- Developer Flag ---
// Set this to `true` to force the onboarding wizard to show for every user, every time.
// Set to `false` for normal behavior (wizard shows only once).
const FORCE_ONBOARDING_WIZARD = true;

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);
  
  const isPublicRoute = publicRoutes.includes(pathname);

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
          setProfile(docSnap.data() as UserProfile);
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
          setProfile(newProfile);
        }
      } catch (error) {
        console.error("Error fetching or creating user profile:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load user profile.' });
      } finally {
        setProfileLoading(false);
      }
    };

    fetchOrCreateProfile();
  }, [user, isUserLoading, firestore, toast]);


  const handleFinishOnboarding = () => {
    if (!profile) return;
    // This is the critical change: update the local state immediately
    // to hide the wizard.
    setProfile({ ...profile, onboardingComplete: true });
  };


  // --- Decision Logic ---

  const isLoading = isUserLoading || isProfileLoading;

  // 1. Show main loader while auth or profile state is being determined
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }
  
  // 2. Handle redirects for unauthenticated users
  if (!user && !isPublicRoute) {
     return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  
  // 3. Handle redirects for logged-in users on public/special routes
  if (user) {
    if (isPublicRoute) {
       return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }
    
     if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified && pathname !== '/verify-email') {
        return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
      }
  }


  // 4. CRITICAL: If onboarding is not complete OR if the force flag is on, show the wizard.
  if (user && profile && (FORCE_ONBOARDING_WIZARD || !profile.onboardingComplete)) {
    return <OnboardingDialog isOpen={true} onFinish={handleFinishOnboarding} />;
  }


  // 5. If all checks pass, render the requested page
  return <>{children}</>;
}
