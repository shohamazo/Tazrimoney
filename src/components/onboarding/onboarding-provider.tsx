'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  
  // We use our own state management here because useDoc can have delays
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isProfileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // Wait for user to be loaded
    if (isUserLoading || !user || !userProfileRef) {
      // If user is logged out, reset state
      if (!user) {
        setProfileLoading(false);
        setDialogOpen(false);
      }
      return;
    }

    const checkAndCreateProfile = async () => {
      setProfileLoading(true);
      try {
        const docSnap = await getDoc(userProfileRef);
        if (docSnap.exists()) {
          const profileData = docSnap.data() as UserProfile;
          setUserProfile(profileData);
          if (profileData.onboardingComplete !== true) {
            setDialogOpen(true);
          } else {
            setDialogOpen(false);
          }
        } else {
          // Profile doesn't exist, create it and start onboarding
          const newProfile: Partial<UserProfile> = {
            id: user.uid,
            email: user.email || undefined,
            displayName: user.displayName || undefined,
            photoURL: user.photoURL || undefined,
            onboardingComplete: false,
          };
          await setDoc(userProfileRef, newProfile, { merge: true });
          setUserProfile(newProfile as UserProfile);
          setDialogOpen(true);
        }
      } catch (error) {
        console.error("Error checking/creating user profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };
    
    // Only run this logic for authenticated, non-anonymous users
    if (!user.isAnonymous) {
        checkAndCreateProfile();
    } else {
        setProfileLoading(false);
    }

  }, [user, userProfileRef, isUserLoading]);


  const handleStartOnboarding = () => {
    setDialogOpen(true);
  };

  const handleFinishOnboarding = async () => {
    if (!userProfileRef) return;
    try {
        // Use a blocking write here to ensure completion
        await setDoc(userProfileRef, { onboardingComplete: true }, { merge: true });
        // Manually update local state to reflect the change immediately
        setUserProfile(prev => prev ? { ...prev, onboardingComplete: true } : { id: userProfileRef.id, onboardingComplete: true });
        setDialogOpen(false);
    } catch (error) {
        console.error("Failed to mark onboarding as complete:", error);
    }
  };
  
  if (isUserLoading || (isProfileLoading && !userProfile)) {
     // Show nothing or a global loader while we determine the onboarding state
    return null;
  }
  
  // Render children immediately, the dialog will appear on top if needed
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
