import type { Timestamp } from "firebase/firestore";
import type { EarningDetails } from "./calculator";

export type UserProfile = {
  id: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  onboardingComplete?: boolean;
  theme?: string;
}

export type Job = {
  id: string;
  name: string;
  hourlyRate: number;
};

export type Shift = {
  id: string;
  jobId: string;
  start: Date | Timestamp;
  end: Date | Timestamp;
  earnings?: number; // Will be calculated
  earningsDetails?: EarningDetails;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  subcategory: string;
  date: Date | Timestamp;
  type: 'one-time' | 'recurring';
};

export type Budget = {
  id: string;
  category: string;
  planned: number;
  spent: number;
  alertThreshold: number; // Percentage (0-100)
};
