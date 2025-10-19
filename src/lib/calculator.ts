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

export type EarningDetails = {
  totalEarnings: number;
  regularHours: number;
  overtime125Hours: number;
  overtime150Hours: number;
  shabbatHours: number;
  regularPay: number;
  overtime125Pay: number;
  overtime150Pay: number;
  shabbatPay: number;
};


/**
 * Calculates shift earnings based on Israeli labor laws for overtime and Shabbat.
 * @param shift The shift object.
 * @param job The job object with the hourly rate.
 * @returns A detailed breakdown of the earnings for the shift.
 */
export function calculateShiftEarnings(shift: Shift, job: Job | undefined): EarningDetails {
  const initialDetails: EarningDetails = {
    totalEarnings: 0,
    regularHours: 0,
    overtime125Hours: 0,
    overtime150Hours: 0,
    shabbatHours: 0,
    regularPay: 0,
    overtime125Pay: 0,
    overtime150Pay: 0,
    shabbatPay: 0,
  };

  if (!job) return initialDetails;

  const start = toDate(shift.start);
  const end = toDate(shift.end);
  const { hourlyRate } = job;
  
  if (start >= end) return initialDetails;

  let totalRegularHoursInShift = 0;
  
  // Iterate hour by hour through the shift
  let currentHour = new Date(start.getTime());

  while (currentHour < end) {
      const nextHour = new Date(currentHour.getTime() + 60 * 60 * 1000);
      const effectiveNextHour = nextHour > end ? end : nextHour;
      
      const durationInMinutes = (effectiveNextHour.getTime() - currentHour.getTime()) / (1000 * 60);
      const durationInHours = durationInMinutes / 60;
      
      if (isShabbat(currentHour)) {
          // Shabbat hours are paid at 150%
          initialDetails.shabbatHours += durationInHours;
          initialDetails.shabbatPay += durationInHours * hourlyRate * 1.5;
      } else {
          totalRegularHoursInShift += durationInHours;
          if (totalRegularHoursInShift > 10) {
              // Overtime hours 11+ are at 150%
              initialDetails.overtime150Hours += durationInHours;
              initialDetails.overtime150Pay += durationInHours * hourlyRate * 1.5;
          } else if (totalRegularHoursInShift > 8) {
              // Overtime hours 9-10 are at 125%
              initialDetails.overtime125Hours += durationInHours;
              initialDetails.overtime125Pay += durationInHours * hourlyRate * 1.25;
          } else {
              // Regular hours
              initialDetails.regularHours += durationInHours;
              initialDetails.regularPay += durationInHours * hourlyRate;
          }
      }
      
      currentHour = nextHour;
  }
  
  initialDetails.totalEarnings = initialDetails.regularPay + initialDetails.overtime125Pay + initialDetails.overtime150Pay + initialDetails.shabbatPay;

  return initialDetails;
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
          totalEarnings += calculateShiftEarnings(shift, job).totalEarnings;
          const start = toDate(shift.start);
          workedDays.add(start.toLocaleDateString('he-IL'));
      }
    });

    return { totalEarnings, daysWorked: workedDays.size };
}
