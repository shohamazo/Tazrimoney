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
  housing: z.string().describe('User\'s housing situation (e.g., "rent", "own", "live with parents")'),
  monthlyHousingCost: z.number().describe('User\'s monthly rent or mortgage payment. 0 if none.'),
  transportation: z.string().describe('User\'s primary mode of transportation (e.g., "car", "public transport", "walk")'),
  diningOutFrequency: z.string().describe('How often the user eats out (e.g., "rarely", "1-2 times a week", "most days")'),
  monthlyIncome: z.number().describe('The user\'s estimated total monthly income.'),
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
  prompt: `You are a helpful financial assistant designed to help users with no financial knowledge create their first budget.
Your goal is to provide sensible, realistic starting budget suggestions based on their answers to a few lifestyle questions.

The user's estimated monthly income is ₪{{{monthlyIncome}}}.
Base your suggestions on this income, but be smart. If their fixed costs are high, adjust discretionary spending downwards.

User's situation:
- Housing: {{{housing}}}
- Monthly Housing Cost: ₪{{{monthlyHousingCost}}}
- Transportation: {{{transportation}}}
- Dines out: {{{diningOutFrequency}}}

Provide budget suggestions for the following categories:
- דיור
- קניות (for groceries, etc.)
- תחבורה
- אוכל ושתיה (for eating out, coffee, etc.)
- חשבונות ושירותים (internet, phone, etc. Estimate standard costs if not provided)
- בילוי ופנאי

Analyze the user's input and generate a reasonable 'planned' monthly budget for each category.
The 'category' field in your output MUST exactly match one of the categories from the list above.

- If the housing cost is ₪0, the 'דיור' budget should be very low (maybe for minor household items).
- If the user has a car, 'תחבורה' should include estimates for fuel, insurance, and maintenance. If they use public transport, it should be lower.
- 'אוכל ושתיה' should strongly correlate with their 'diningOutFrequency'.
- 'קניות' should be a reasonable amount for a single person's groceries.
- 'חשבונות ושירותים' should include common utilities like phone, internet, etc. A standard estimate is fine.
- 'בילוי ופנאי' is discretionary. Adjust it based on how much income is left after essential costs.

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
