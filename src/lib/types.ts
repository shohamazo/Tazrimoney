export type Job = {
  id: string;
  name: string;
  hourlyRate: number;
};

export type Shift = {
  id: string;
  jobId: string;
  start: Date;
  end: Date;
  earnings?: number; // Will be calculated
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  type: 'one-time' | 'recurring';
};

export type Budget = {
  category: string;
  planned: number;
  spent: number;
};
