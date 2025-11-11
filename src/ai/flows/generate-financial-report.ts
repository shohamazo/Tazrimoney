'use server';

/**
 * @fileOverview Generates a comprehensive financial report based on 6 months of data.
 *
 * - generateFinancialReport - A function that generates the financial report.
 * - GenerateFinancialReportInput - The input type.
 * - GenerateFinancialReportOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const OnboardingDataSchema = z.object({
    monthlyIncome: z.number().optional(),
    housing: z.string().optional(),
    monthlyHousingCost: z.number().optional(),
    transportation: z.string().optional(),
    diningOutFrequency: z.string().optional(),
    hasChildren: z.boolean().optional(),
    hasDebt: z.boolean().optional(),
    savingsGoal: z.string().optional(),
    hasPets: z.boolean().optional(),
    takesMeds: z.boolean().optional(),
    isStudent: z.boolean().optional(),
    groceryStyle: z.string().optional(),
    subscriptions: z.array(z.string()).optional(),
    clothingHabits: z.string().optional(),
    entertainmentHabits: z.string().optional(),
    groomingBudget: z.number().optional(),
    travelPlans: z.boolean().optional(),
}).optional();


const GenerateFinancialReportInputSchema = z.object({
  data: z.string().describe('A JSON string containing the financial data for the last 6 months. It includes monthly income/expense breakdowns and raw expense data.'),
  tier: z.enum(['basic', 'pro']).describe("The user's subscription tier."),
  onboardingData: OnboardingDataSchema.describe("User's lifestyle and financial goals information from the onboarding survey. This is only provided for 'pro' tier users."),
});
export type GenerateFinancialReportInput = z.infer<typeof GenerateFinancialReportInputSchema>;

const GenerateFinancialReportOutputSchema = z.object({
  summary: z.string().describe('A detailed, insightful summary of the financial data in Hebrew. It must include a comparison of total income vs. total expenses, identification of the top spending category, and analysis of any significant spending spikes with details on the transactions that caused them. For pro users, it should also include predictive analysis and actionable advice based on their lifestyle.'),
});
export type GenerateFinancialReportOutput = z.infer<typeof GenerateFinancialReportOutputSchema>;


const prompt = ai.definePrompt({
  name: 'generateFinancialReportPrompt',
  input: {schema: GenerateFinancialReportInputSchema},
  output: {schema: GenerateFinancialReportOutputSchema},
  prompt: `You are a helpful financial assistant. Your task is to analyze the provided 6-month financial data and generate a clear, insightful summary in Hebrew.

{{#if onboardingData}}
# PRO TIER REPORT
You are a Pro-level financial advisor. In addition to the basic analysis, you must provide advanced, predictive, and actionable insights.

**User's Lifestyle Profile:**
This user has provided the following information about their lifestyle and goals. Use this information to make your advice highly personalized and relevant.
- Housing: {{onboardingData.housing}}
- Transportation: {{onboardingData.transportation}}
- Savings Goal: {{onboardingData.savingsGoal}}
- Habits: Eats out {{onboardingData.diningOutFrequency}}, entertainment is usually {{onboardingData.entertainmentHabits}}.
- Key Life Factors: Has children: {{onboardingData.hasChildren}}, Has pets: {{onboardingData.hasPets}}, Has debt: {{onboardingData.hasDebt}}

**Your Pro-level analysis must include:**
1.  **Basic Summary**: Start with the standard analysis (Income vs. Expenses, Top Spending Category, Spending Spikes).
2.  **Predictive Warning**: Analyze recurring expenses (e.g., rent, subscriptions) and spending patterns. Project these forward for the next month. Compare this with their average income. Issue a clear warning if it looks like they might face a shortfall for major upcoming expenses (e.g., "נראה שבחודש הבא, עם הוצאות קבועות של ₪XXXX, ייתכן ויהיה לך קשה לכסות את שכר הדירה.").
3.  **Actionable Advice (Personalized)**: Based on their spending and their stated lifestyle goals, provide 2-3 specific, actionable recommendations.
    -   Connect the advice to their goals. Example: "כדי להגיע ליעד החיסכון שלך לרכישה גדולה, אנו ממליצים לבחון את ההוצאות על 'אוכל בחוץ', שהסתכמו ב-₪XXXX. נסה להחליף ארוחה אחת בשבוע בארוחה ביתית."
    -   Example: "שמנו לב שאתה מוציא סכום משמעותי על תחבורה ברכב פרטי. בהתחשב בכך שאתה גר קרוב למרכז, אולי כדאי לשקול שימוש בתחבורה ציבורית יום-יומיים בשבוע כדי לחסוך בעלויות הדלק והחניה."
4.  **Positive Reinforcement**: Find one area where they are doing well (e.g., consistent savings, low spending in a certain category) and praise them for it.

Structure your response clearly with headings for each section.
{{else}}
# BASIC TIER REPORT
**Your summary must cover these key points:**
1.  **Income vs. Expenses**: Compare the total income and total expenses for the entire period. Calculate the net balance (income - expenses).
2.  **Top Spending Category**: Identify the category where the most money was spent. State the category and the total amount spent in it.
3.  **Spending Spikes**: Analyze the monthly expenses to find any significant spikes in spending. A spike is a month where expenses are unusually high compared to the average. For each spike, identify the month and the specific expenses that contributed most to it.
4.  **General Insights**: Provide 1-2 brief, actionable insights or observations based on the data. For example, "Your income was highest in [Month]" or "Spending on [Category] has been consistent."
{{/if}}

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
