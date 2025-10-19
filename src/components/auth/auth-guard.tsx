'use client';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { OnboardingDialog } from '@/components/onboarding/onboarding-dialog';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const publicRoutes = ['/login', '/verify-email'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  
  // We use our own state to manage loading and profile data
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (isUserLoading) return; // Wait for Firebase Auth to be ready
    if (!user || !firestore) {
      setProfileLoading(false); // Not logged in, no profile to load
      return;
    }

    const fetchOrCreateProfile = async () => {
      setProfileLoading(true);
      try {
        const docSnap = await getDoc(userProfileRef!);
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
          await setDoc(userProfileRef!, newProfile);
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
  }, [user, isUserLoading, firestore, userProfileRef, toast]);


  const handleFinishOnboarding = async () => {
    if (!userProfileRef) return;
    try {
      await setDoc(userProfileRef, { onboardingComplete: true }, { merge: true });
      // Manually update profile state to trigger re-render
      setProfile(prev => prev ? { ...prev, onboardingComplete: true } : { id: user!.uid, onboardingComplete: true });
    } catch (error) {
      console.error("Failed to mark onboarding as complete:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save onboarding status.' });
    }
  };


  // --- Decision Logic ---

  // 1. Show main loader while auth or profile state is being determined
  if (isUserLoading || isProfileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  // 2. If user is not logged in, redirect to login unless on a public route
  if (!user && !isPublicRoute) {
    router.replace('/login');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (user) {
    // 3. Handle redirects for logged-in users
    if (isPublicRoute) {
      router.replace('/');
      return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }
    
    if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified && pathname !== '/verify-email') {
      router.replace('/verify-email');
      return <div className="flex h-screen w-full items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

    // 4. CRITICAL: If onboarding is not complete, show the wizard and nothing else.
    if (profile && !profile.onboardingComplete) {
      return <OnboardingDialog isOpen={true} onFinish={handleFinishOnboarding} />;
    }
  }

  // 5. If all checks pass, render the requested page
  return <>{children}</>;
}
