import type { Timestamp } from "firebase/firestore";

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
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date | Timestamp;
  type: 'one-time' | 'recurring';
};

export type Budget = {
  id: string;
  category: string;
  planned: number;
  spent: number;
};
