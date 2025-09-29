
'use server';

/**
 * @fileOverview Provides AI-powered spending alerts based on user's past spending.
 *
 * - getSpendingAlerts - A function that provides proactive alerts on spending habits.
 * - SpendingAlertsInput - The input type for the getSpendingAlerts function.
 * - SpendingAlertsOutput - The return type for the getSpendingAlerts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpendingAlertsInputSchema = z.object({
  income: z.number().describe("The user's monthly income."),
  goals: z.array(z.object({
    name: z.string(),
    targetAmount: z.number(),
    monthlyContribution: z.number(),
  })).describe("The user's financial goals."),
  expensesData: z.array(z.object({
      amount: z.number(),
      category: z.string(),
      date: z.string(),
  })).describe('Historical expenses data.'),
});
export type SpendingAlertsInput = z.infer<typeof SpendingAlertsInputSchema>;

const SpendingAlertsOutputSchema = z.object({
  alerts: z.string().describe('Proactive alerts based on spending trends.'),
});
export type SpendingAlertsOutput = z.infer<typeof SpendingAlertsOutputSchema>;

export async function getSpendingAlerts(input: SpendingAlertsInput): Promise<SpendingAlertsOutput> {
  return spendingAlertsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'spendingAlertsPrompt',
  input: {schema: SpendingAlertsInputSchema},
  output: {schema: SpendingAlertsOutputSchema},
  prompt: `You are Kwik Kash's proactive financial analyst. Your job is to analyze a user's spending habits and provide a concise, actionable alert to help them improve.

## User's Financial Profile:
- **Monthly Income:** ₹{{{income}}}
- **Financial Goals:**
{{#each goals}}
  - Save for '{{name}}' (Target: ₹{{targetAmount}}, Monthly Contribution: ₹{{monthlyContribution}})
{{/each}}

## User's Recent Spending History:
{{#each expensesData}}
- **Date:** {{date}}
  - **Category:** {{category}}
  - **Amount:** ₹{{amount}}
{{/each}}

## Your Task:
Based on all the information above, generate a single, concise, and actionable alert.

1.  **Analyze Spending Patterns:** Look at the user's recent spending. Identify the top 1-2 categories where they spend the most. Note any unusually high spending.
2.  **Compare to Goals:** Assess if the current spending patterns are sustainable given their savings goals. Is high discretionary spending in one area jeopardizing their ability to meet their monthly contribution targets?
3.  **Create Proactive Alert:** Generate a single, friendly, and encouraging alert. The alert should highlight a specific spending habit and connect it to a potential impact on a financial goal. Be specific.

**Good Alert Example:** "Your spending on 'Food & Dining' has been 20% higher than average this week. Scaling this back just a little could help you reach your 'New Laptop' goal faster!"
**Bad Alert Example:** "You are spending too much money."

Now, generate the 'alerts' field based on your analysis of the user's data.`,
});

const spendingAlertsFlow = ai.defineFlow(
  {
    name: 'spendingAlertsFlow',
    inputSchema: SpendingAlertsInputSchema,
    outputSchema: SpendingAlertsOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI model returned no output for spending alerts.');
      }
      return output;
    } catch (error) {
      console.error('Error in spendingAlertsFlow:', error);
      return {
        alerts: 'The AI service is temporarily unavailable. Please try again later.',
      };
    }
  }
);


