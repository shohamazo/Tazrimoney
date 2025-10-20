'use server';
/**
 * @fileOverview An AI flow for generating budget suggestions based on user lifestyle.
 *
 * - generateBudgetSuggestions - A function that suggests budget allocations.
 * - BudgetSuggestionInput - The input type for the function.
 * - BudgetSuggestionOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const BudgetSuggestionInputSchema = z.object({
  monthlyIncome: z.number().describe('The user\'s estimated total monthly income.'),
  housing: z.string().describe('User\'s housing situation (e.g., "rent", "own", "live with parents")'),
  monthlyHousingCost: z.number().describe('User\'s monthly rent or mortgage payment. 0 if none.'),
  transportation: z.string().describe('User\'s primary mode of transportation (e.g., "car", "public transport", "walk")'),
  diningOutFrequency: z.string().describe('How often the user eats out (e.g., "rarely", "1-2 times a week", "most days")'),
  hasDebt: z.string().describe('If the user has active debt (e.g., "yes", "no")'),
  savingsGoal: z.string().describe('The user\'s primary savings goal (e.g., "none", "emergency fund", "large purchase", "investing")'),
});
export type BudgetSuggestionInput = z.infer<typeof BudgetSuggestionInputSchema>;

const BudgetItemSchema = z.object({
    category: z.string().describe('The expense category. Must be one of the provided categories.'),
    planned: z.number().describe('The suggested monthly budget amount for this category.'),
});

const BudgetSuggestionOutputSchema = z.object({
  suggestions: z.array(BudgetItemSchema).describe('An array of budget suggestions for various categories.'),
});
export type BudgetSuggestionOutput = z.infer<typeof BudgetSuggestionOutputSchema>;


const prompt = ai.definePrompt({
  name: 'generateBudgetSuggestionsPrompt',
  input: { schema: BudgetSuggestionInputSchema },
  output: { schema: BudgetSuggestionOutputSchema },
  prompt: `You are a helpful and realistic financial assistant. Your goal is to provide sensible, achievable starting budget suggestions for users with little financial knowledge.

The user's estimated monthly income is ₪{{{monthlyIncome}}}. This is the most important constraint.

**CRITICAL RULE: The total of all 'planned' budget amounts you suggest MUST NOT exceed the user's monthly income. Be conservative. It is better to budget less than to budget too much.**

After accounting for fixed costs like housing, be very realistic about discretionary spending. If the remaining income is low, categories like 'בילוי ופנאי', 'אוכל ושתיה', and 'קניות' must be adjusted downwards significantly. Prioritize essentials.

User's situation:
- Housing: {{{housing}}}
- Monthly Housing Cost: ₪{{{monthlyHousingCost}}}
- Transportation: {{{transportation}}}
- Dines out: {{{diningOutFrequency}}}
- Has Debt: {{{hasDebt}}}
- Savings Goal: {{{savingsGoal}}}

Provide budget suggestions for the following categories:
- דיור
- קניות (for groceries, etc.)
- תחבורה
- אוכל ושתיה (for eating out, coffee, etc.)
- חשבונות ושירותים (internet, phone, etc. Estimate standard costs if not provided)
- בילוי ופנאי
- חיסכון והשקעות
- תשלומים וחיובים (for debt repayment)

Analyze the user's input and generate a reasonable 'planned' monthly budget for each category.
The 'category' field in your output MUST exactly match one of the categories from the list above.

- If 'housing' is "rent" or "own", the 'דיור' budget MUST equal 'monthlyHousingCost'. If it's "live with parents", the 'דיור' budget should be very low (maybe for minor household items).
- If 'hasDebt' is "yes", allocate a reasonable amount to 'תשלומים וחיובים', even if it's small.
- If 'savingsGoal' is not "none", allocate a meaningful amount to 'חיסכון והשקעות'. Prioritize an emergency fund.
- 'תחבורה' should be higher for a car owner (fuel, insurance, maintenance) and lower for public transport.
- 'אוכל ושתיה' should strongly correlate with 'diningOutFrequency'. If 'rarely', this should be low.
- 'חשבונות ושירותים' should include standard estimates for phone, internet, etc. (e.g., 200-400 ILS total).
- 'בילוי ופנאי' is highly discretionary. This should be one of the first categories to be reduced if income is tight.

Return the suggestions in the 'suggestions' array.
`,
});

const generateBudgetSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateBudgetSuggestionsFlow',
    inputSchema: BudgetSuggestionInputSchema,
    outputSchema: BudgetSuggestionOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function generateBudgetSuggestions(input: BudgetSuggestionInput): Promise<BudgetSuggestionOutput> {
  return generateBudgetSuggestionsFlow(input);
}
