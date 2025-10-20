'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useFirebase } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { UserProfile } from '@/lib/types';
import { OnboardingDialog } from './onboarding-dialog';

// This provider is now much simpler. Its main job is to ensure a user profile
// document exists in Firestore. The decision to show the dialog is now handled
// by the AuthGuard.

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { firestore, user, isUserLoading } = useFirebase();

  useEffect(() => {
    // This effect ensures that a user document exists in Firestore as soon as
    // a user is authenticated.
    const ensureUserProfileExists = async () => {
      if (isUserLoading || !user || !firestore) {
        return;
      }

      const userProfileRef = doc(firestore, 'users', user.uid);
      
      try {
        const docSnap = await getDoc(userProfileRef);
        if (!docSnap.exists()) {
          // If the document doesn't exist, create it silently.
          // The AuthGuard will see `onboardingComplete: false` on its own fetch
          // and decide to show the dialog.
          const newProfile: UserProfile = {
            id: user.uid,
            email: user.email || null,
            displayName: user.displayName || user.phoneNumber || null,
            photoURL: user.photoURL || null,
            onboardingComplete: false,
          };
          await setDoc(userProfileRef, newProfile, { merge: true });
        }
      } catch (error) {
        console.error("Error ensuring user profile exists:", error);
      }
    };

    ensureUserProfileExists();
  }, [user, isUserLoading, firestore]);

  // The provider no longer needs to manage the dialog's state (isOpen).
  // It just renders its children. The AuthGuard now controls what is displayed.
  return <>{children}</>;
}
