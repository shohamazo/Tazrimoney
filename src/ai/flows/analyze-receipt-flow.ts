'use server';
/**
 * @fileOverview An AI flow for analyzing expense receipts.
 *
 * - analyzeReceipt - A function that analyzes a receipt image.
 * - AnalyzeReceiptInput - The input type for the analyzeReceipt function.
 * - AnalyzeReceiptOutput - The return type for the analyzeReceipt function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { expenseCategories } from '@/lib/expense-categories';

const AnalyzeReceiptInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeReceiptInput = z.infer<typeof AnalyzeReceiptInputSchema>;

const AnalyzeReceiptOutputSchema = z.object({
  amount: z.number().describe('The total amount found on the receipt. Must be a number.'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format. If no date is found, use the current date.'),
  vendor: z.string().describe('The name of the vendor or store.'),
  suggestedCategory: z.string().describe('The suggested expense category based on the vendor or items.'),
  suggestedSubcategory: z.string().describe('The suggested expense subcategory.'),
});
export type AnalyzeReceiptOutput = z.infer<typeof AnalyzeReceiptOutputSchema>;

export async function analyzeReceipt(input: AnalyzeReceiptInput): Promise<AnalyzeReceiptOutput> {
  return analyzeReceiptFlow(input);
}

// Prepare categories for the prompt
const categoryPromptData = expenseCategories.map(cat => ({
  label: cat.label,
  value: cat.value,
  subcategories: cat.subcategories.map(sub => ({ label: sub.label, value: sub.value })).join(', '),
})).join('\n');


const prompt = ai.definePrompt({
  name: 'analyzeReceiptPrompt',
  input: { schema: AnalyzeReceiptInputSchema },
  output: { schema: AnalyzeReceiptOutputSchema },
  prompt: `You are an expert receipt processing assistant. Analyze the provided receipt image and extract the following information.

Your task is to identify:
1.  **Total Amount**: Find the final, total amount paid. It is usually labeled "Total", "סה"כ", or is the largest number at the bottom.
2.  **Date**: Find the transaction date. Return it in YYYY-MM-DD format. If no date is visible, use today's date.
3.  **Vendor**: Identify the name of the store or vendor.
4.  **Category Suggestion**: Based on the vendor name and items on the receipt, suggest the most relevant expense category and subcategory from the list provided below. The output for "suggestedCategory" and "suggestedSubcategory" MUST be one of the "label" values from the list.

Here are the available categories and subcategories:
---
${categoryPromptData}
---

Example: If the receipt is from "Shufersal", a good suggestion would be category "קניות" and subcategory "קניות בסופר". If it's from "McDonald's", suggest "אוכל ושתיה" and "אוכל מהיר".

Analyze this receipt:
{{media url=photoDataUri}}`,
});

const analyzeReceiptFlow = ai.defineFlow(
  {
    name: 'analyzeReceiptFlow',
    inputSchema: AnalyzeReceiptInputSchema,
    outputSchema: AnalyzeReceiptOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
