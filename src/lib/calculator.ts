import type { Shift, Job } from './types';
import { Timestamp } from 'firebase/firestore';

// Helper to convert Firebase Timestamp or Date to a Date object
const toDate = (date: Date | Timestamp): Date => {
  return date instanceof Timestamp ? date.toDate() : date;
};

/**
 * Checks if a given date falls on Shabbat (Friday sunset to Saturday sunset).
 * This is a simplified check, assuming Shabbat starts at 17:00 on Friday and ends at 19:00 on Saturday.
 * @param date The date to check.
 * @returns True if the date is on Shabbat, false otherwise.
 */
function isShabbat(date: Date): boolean {
  const day = date.getDay(); // Sunday is 0, Saturday is 6
  const hours = date.getHours();

  // Friday from 5 PM onwards
  if (day === 5 && hours >= 17) {
    return true;
  }
  // All of Saturday until 7 PM
  if (day === 6 && hours < 19) {
    return true;
  }
  return false;
}

/**
 * Calculates shift earnings based on Israeli labor laws for overtime and Shabbat.
 * @param shift The shift object.
 * @param job The job object with the hourly rate.
 * @returns The total calculated earnings for the shift.
 */
export function calculateShiftEarnings(shift: Shift, job: Job | undefined): number {
  if (!job) return 0;

  const start = toDate(shift.start);
  const end = toDate(shift.end);
  const { hourlyRate } = job;
  
  if (start >= end) return 0;

  let totalEarnings = 0;
  let regularHours = 0;
  
  // Iterate hour by hour through the shift
  let currentHour = new Date(start.getTime());

  while (currentHour < end) {
      const nextHour = new Date(currentHour.getTime() + 60 * 60 * 1000);
      const effectiveNextHour = nextHour > end ? end : nextHour;
      
      const durationInMinutes = (effectiveNextHour.getTime() - currentHour.getTime()) / (1000 * 60);
      const durationInHours = durationInMinutes / 60;
      
      let currentRate = hourlyRate;

      if (isShabbat(currentHour)) {
          // Shabbat hours are paid at 150%
          currentRate = hourlyRate * 1.5;
      } else {
          regularHours += durationInHours;
          if (regularHours > 10) {
              // Overtime hours 11+ are at 150%
              currentRate = hourlyRate * 1.5;
          } else if (regularHours > 8) {
              // Overtime hours 9-10 are at 125%
              currentRate = hourlyRate * 1.25;
          }
      }
      
      totalEarnings += durationInHours * currentRate;
      currentHour = nextHour;
  }
  
  return totalEarnings;
}

/**
 * Calculates earnings for a collection of shifts, using a map of jobs.
 * @param shifts An array of shift objects.
 * @param jobs An array of job objects.
 * @returns An object containing total earnings and the number of unique days worked.
 */
export function calculateTotalEarningsForShifts(shifts: Shift[], jobs: Job[]) {
    if (!shifts || !jobs || jobs.length === 0) return { totalEarnings: 0, daysWorked: 0 };
    
    const jobsMap = new Map(jobs.map(j => [j.id, j]));
    let totalEarnings = 0;
    const workedDays = new Set<string>();
    
    shifts.forEach(shift => {
      const job = jobsMap.get(shift.jobId);
      if (job) {
          totalEarnings += calculateShiftEarnings(shift, job);
          const start = toDate(shift.start);
          workedDays.add(start.toLocaleDateString('he-IL'));
      }
    });

    return { totalEarnings, daysWorked: workedDays.size };
}
