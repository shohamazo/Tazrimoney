'use server';

/**
 * @fileOverview Generates a comprehensive financial report based on 6 months of data.
 *
 * - generateFinancialReport - A function that generates the financial report.
 * - GenerateFinancialReportInput - The input type.
 * - GenerateFinancialReportOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFinancialReportInputSchema = z.object({
  data: z.string().describe('A JSON string containing the financial data for the last 6 months. It includes monthly income/expense breakdowns and raw expense data.'),
});
export type GenerateFinancialReportInput = z.infer<typeof GenerateFinancialReportInputSchema>;

const GenerateFinancialReportOutputSchema = z.object({
  summary: z.string().describe('A detailed, insightful summary of the financial data in Hebrew. It must include a comparison of total income vs. total expenses, identification of the top spending category, and analysis of any significant spending spikes with details on the transactions that caused them.'),
});
export type GenerateFinancialReportOutput = z.infer<typeof GenerateFinancialReportOutputSchema>;


const prompt = ai.definePrompt({
  name: 'generateFinancialReportPrompt',
  input: {schema: GenerateFinancialReportInputSchema},
  output: {schema: GenerateFinancialReportOutputSchema},
  prompt: `You are a helpful financial assistant. Your task is to analyze the provided 6-month financial data and generate a clear, insightful summary in Hebrew.

Your summary must cover these key points:
1.  **Income vs. Expenses**: Compare the total income and total expenses for the entire period. Calculate the net balance (income - expenses).
2.  **Top Spending Category**: Identify the category where the most money was spent. State the category and the total amount spent in it.
3.  **Spending Spikes**: Analyze the monthly expenses to find any significant spikes in spending. A spike is a month where expenses are unusually high compared to the average. For each spike, identify the month and the specific expenses that contributed most to it.
4.  **General Insights**: Provide 1-2 brief, actionable insights or observations based on the data. For example, "Your income was highest in [Month]" or "Spending on [Category] has been consistent."

Analyze the following data:
{{{data}}}

Please provide the final summary in the 'summary' field. Be thorough and clear.`,
});

const generateFinancialReportFlow = ai.defineFlow(
  {
    name: 'generateFinancialReportFlow',
    inputSchema: GenerateFinancialReportInputSchema,
    outputSchema: GenerateFinancialReportOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

export async function generateFinancialReport(input: GenerateFinancialReportInput): Promise<GenerateFinancialReportOutput> {
  return generateFinancialReportFlow(input);
}
