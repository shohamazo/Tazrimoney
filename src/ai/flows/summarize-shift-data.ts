'use server';

/**
 * @fileOverview Summarizes shift data for a user over a given period.
 *
 * - summarizeShiftData - A function that summarizes shift data.
 * - SummarizeShiftDataInput - The input type for the summarizeShiftData function.
 * - SummarizeShiftDataOutput - The return type for the summarizeShiftData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeShiftDataInputSchema = z.object({
  startDate: z.string().describe('The start date for the shift data summary.'),
  endDate: z.string().describe('The end date for the shift data summary.'),
  shiftData: z.string().describe('JSON string of shift data for the period, array of objects with start and end times, and job types.'),
});
export type SummarizeShiftDataInput = z.infer<typeof SummarizeShiftDataInputSchema>;

const SummarizeShiftDataOutputSchema = z.object({
  summary: z.string().describe('A summary of the shift data, including total hours worked, total earnings, and a breakdown by job type.'),
});
export type SummarizeShiftDataOutput = z.infer<typeof SummarizeShiftDataOutputSchema>;

export async function summarizeShiftData(input: SummarizeShiftDataInput): Promise<SummarizeShiftDataOutput> {
  return summarizeShiftDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeShiftDataPrompt',
  input: {schema: SummarizeShiftDataInputSchema},
  output: {schema: SummarizeShiftDataOutputSchema},
  prompt: `You are a financial assistant that helps users summarize their shift data.

You will receive shift data, a start date, and an end date. You will calculate the total hours worked, total earnings, and a breakdown by job type.

Start Date: {{{startDate}}}
End Date: {{{endDate}}}
Shift Data: {{{shiftData}}}

Summary:`, // Removed JSON mode, direct text output
});

const summarizeShiftDataFlow = ai.defineFlow(
  {
    name: 'summarizeShiftDataFlow',
    inputSchema: SummarizeShiftDataInputSchema,
    outputSchema: SummarizeShiftDataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
