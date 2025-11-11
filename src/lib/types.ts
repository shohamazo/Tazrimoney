import type { Timestamp } from "firebase/firestore";
import type { EarningDetails } from "./calculator";
import type { InitialBudgetInput } from "./budget-calculator";

export type UserProfile = {
  id: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  onboardingComplete?: boolean;
  theme?: string;
  tier?: 'free' | 'basic' | 'pro';
  lastReportDate?: Timestamp;
  cachedReport?: string;
  onboardingData?: InitialBudgetInput;
}

export type DaySchedule = {
  enabled: boolean;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
};

export type WeeklySchedule = {
  sunday: DaySchedule;
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
};


export type Job = {
  id: string;
  name: string;
  hourlyRate: number;
  travelRatePerShift?: number;
  overtimeThresholdHours?: number;
  areBreaksPaid?: boolean;
  sickDayPayPercentage?: number;
  sickDayStartDay?: number;
  isEligibleForBonus?: boolean;
  bonusPercentage?: number;
  shiftReminderTime?: number; // Minutes before shift to send reminder. 0 means disabled.
  weeklySchedule?: WeeklySchedule;
};

export type Shift = {
  id:string;
  jobId: string;
  start: Date | Timestamp;
  end: Date | Timestamp;
  salesAmount?: number;
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

    

    

    