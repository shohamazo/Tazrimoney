'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { OnboardingDialog } from './onboarding-dialog';

interface OnboardingContextType {
  startOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isDialogOpen, setDialogOpen] = useState(false);
  const { firestore, user, isUserLoading } = useFirebase();

  const userProfileRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    // Wait for user and profile to be loaded
    if (isUserLoading || isProfileLoading || !user) {
      return;
    }
    
    // If we have a user but their profile doesn't exist or onboarding isn't complete, start the process.
    if (!user.isAnonymous && (!userProfile || userProfile.onboardingComplete !== true)) {
        setDialogOpen(true);
    }
  }, [user, userProfile, isUserLoading, isProfileLoading]);


  const handleStartOnboarding = () => {
    setDialogOpen(true);
  };

  const handleFinishOnboarding = async () => {
    if (!userProfileRef) return;
    try {
        await setDoc(userProfileRef, { onboardingComplete: true }, { merge: true });
        setDialogOpen(false);
    } catch (error) {
        console.error("Failed to mark onboarding as complete:", error);
    }
  };
  
  if (!user) {
    return <>{children}</>
  }

  return (
    <OnboardingContext.Provider value={{ startOnboarding: handleStartOnboarding }}>
      {children}
      <OnboardingDialog
        isOpen={isDialogOpen}
        onFinish={handleFinishOnboarding}
      />
    </OnboardingContext.Provider>
  );
}
