'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { OnboardingDialog } from './onboarding-dialog';
import { useFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { InitialBudgetInput } from '@/lib/budget-calculator';

interface OnboardingContextType {
  startWizard: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [isWizardOpen, setWizardOpen] = useState(false);
  const { user, firestore } = useFirebase();

  const startWizard = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const handleFinish = useCallback(async (onboardingData: InitialBudgetInput) => {
    setWizardOpen(false);
    // When the wizard is manually finished, we ensure the flag is set in Firestore.
    if (user && firestore) {
      const userProfileRef = doc(firestore, 'users', user.uid);
      try {
        await setDoc(userProfileRef, { 
          onboardingComplete: true,
          onboardingData: onboardingData 
        }, { merge: true });
      } catch (error) {
        console.error("Failed to set onboarding complete flag and data:", error);
      }
    }
  }, [user, firestore]);
  
  const value = { startWizard };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {isWizardOpen && <OnboardingDialog isOpen={isWizardOpen} onFinish={handleFinish} />}
    </OnboardingContext.Provider>
  );
}

    