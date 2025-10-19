'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useFirebase } from '@/firebase';
import { doc, setDoc, getDoc, DocumentReference } from 'firebase/firestore';
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
  const [isProfileLoading, setProfileLoading] = useState(true);

  const checkAndCreateProfile = useCallback(async () => {
    if (!firestore || !user || user.isAnonymous) {
      setProfileLoading(false);
      setDialogOpen(false);
      return;
    }

    const userProfileRef = doc(firestore, 'users', user.uid);
    
    setProfileLoading(true);
    try {
      const docSnap = await getDoc(userProfileRef);
      if (docSnap.exists()) {
        const profileData = docSnap.data() as UserProfile;
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
          displayName: user.displayName || user.phoneNumber || undefined,
          photoURL: user.photoURL || undefined,
          onboardingComplete: false,
        };
        await setDoc(userProfileRef, newProfile, { merge: true });
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("Error checking/creating user profile:", error);
    } finally {
      setProfileLoading(false);
    }
  }, [firestore, user]);


  useEffect(() => {
    if (isUserLoading) return; // Wait for user to be loaded
    checkAndCreateProfile();
  }, [user, isUserLoading, checkAndCreateProfile]);


  const handleStartOnboarding = () => {
    setDialogOpen(true);
  };

  const handleFinishOnboarding = async () => {
    if (!user || !firestore) return;
    const userProfileRef = doc(firestore, 'users', user.uid);
    try {
        // Use a blocking write here to ensure completion
        await setDoc(userProfileRef, { onboardingComplete: true }, { merge: true });
        setDialogOpen(false);
    } catch (error) {
        console.error("Failed to mark onboarding as complete:", error);
    }
  };
  
  if (isUserLoading || isProfileLoading) {
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
