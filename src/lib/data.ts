import type { Job, Shift, Expense, Budget } from './types';

export const jobs: Job[] = [
  { id: 'job-1', name: 'מלצרות באירועים', hourlyRate: 45 },
  { id: 'job-2', name: 'ברמן בפאב', hourlyRate: 40 },
  { id: 'job-3', name: 'שירות לקוחות', hourlyRate: 38 },
];

export const shifts: Shift[] = [
  { id: 'shift-1', jobId: 'job-1', start: new Date('2024-07-15T18:00:00'), end: new Date('2024-07-16T02:00:00') },
  { id: 'shift-2', jobId: 'job-2', start: new Date('2024-07-17T21:00:00'), end: new Date('2024-07-18T03:00:00') },
  { id: 'shift-3', jobId: 'job-1', start: new Date('2024-07-19T19:00:00'), end: new Date('2024-07-20T01:00:00') },
  { id: 'shift-4', jobId: 'job-3', start: new Date('2024-07-20T09:00:00'), end: new Date('2024-07-20T17:00:00') },
  { id: 'shift-5', jobId: 'job-2', start: new Date('2024-07-22T22:00:00'), end: new Date('2024-07-23T04:00:00') },
];

export const expenseCategories = ['אוכל', 'תחבורה', 'בילויים', 'שכר דירה', 'חשבונות', 'אחר'];

export const expenses: Expense[] = [
  { id: 'exp-1', description: 'קניות בסופר', amount: 350, category: 'אוכל', date: new Date('2024-07-15'), type: 'one-time' },
  { id: 'exp-2', description: 'שכר דירה', amount: 3200, category: 'שכר דירה', date: new Date('2024-07-10'), type: 'recurring' },
  { id: 'exp-3', description: 'חשבון חשמל', amount: 250, category: 'חשבונות', date: new Date('2024-07-20'), type: 'recurring' },
  { id: 'exp-4', description: 'יציאה עם חברים', amount: 180, category: 'בילויים', date: new Date('2024-07-18'), type: 'one-time' },
  { id: 'exp-5', description: 'רב-קו חודשי', amount: 225, category: 'תחבורה', date: new Date('2024-07-01'), type: 'recurring' },
];

export const budgets: Budget[] = [
  { category: 'אוכל', planned: 1500, spent: 800 },
  { category: 'תחבורה', planned: 400, spent: 225 },
  { category: 'בילויים', planned: 800, spent: 500 },
  { category: 'שכר דירה', planned: 3200, spent: 3200 },
  { category: 'חשבונות', planned: 600, spent: 250 },
  { category: 'אחר', planned: 500, spent: 150 },
];
