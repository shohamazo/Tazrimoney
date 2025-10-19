'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useFirebase } from '@/firebase';
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
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    // This function will run when user or isUserLoading state changes.
    const checkAndSetOnboarding = async () => {
      // Don't do anything until Firebase Auth has determined the user's state.
      if (isUserLoading) {
        setLoading(true);
        return;
      }

      // If there's no user, onboarding is not relevant.
      if (!user || !firestore) {
        setLoading(false);
        setDialogOpen(false);
        return;
      }

      // At this point, we have a user. We need to check their profile in Firestore.
      setLoading(true);
      const userProfileRef = doc(firestore, 'users', user.uid);

      try {
        const docSnap = await getDoc(userProfileRef);

        if (docSnap.exists()) {
          // The user's profile document exists in Firestore.
          const profileData = docSnap.data() as UserProfile;
          if (profileData.onboardingComplete) {
            // They have completed onboarding.
            setDialogOpen(false);
          } else {
            // They have a profile but haven't finished onboarding.
            setDialogOpen(true);
          }
        } else {
          // The user's profile document does NOT exist. This is a brand new user.
          // Create their profile and start the onboarding.
          const newProfile: Partial<UserProfile> = {
            id: user.uid,
            email: user.email || undefined,
            displayName: user.displayName || user.phoneNumber || undefined,
            photoURL: user.photoURL || undefined,
            onboardingComplete: false, // Explicitly set to false
          };
          await setDoc(userProfileRef, newProfile, { merge: true });
          // Show the wizard.
          setDialogOpen(true);
        }
      } catch (error) {
        console.error("Error checking or creating user profile:", error);
        // Fallback to not showing the dialog on error.
        setDialogOpen(false);
      } finally {
        setLoading(false);
      }
    };

    checkAndSetOnboarding();
  }, [user, isUserLoading, firestore]);


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
  
  if (isLoading) {
     // Render nothing while we determine the onboarding state.
     // This prevents a flash of the main app content.
    return null;
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
