
'use server';

/**
 * @fileOverview Provides AI-powered spending forecasts based on user's past spending and seasonal trends.
 *
 * - forecastSpending - A function that forecasts spending limits and provides proactive alerts.
 * - ForecastSpendingInput - The input type for the forecastSpending function.
 * - ForecastSpendingOutput - The return type for the forecastSpending function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ForecastSpendingInputSchema = z.object({
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
  seasonalTrends: z
    .string()
    .describe('Seasonal trends data in JSON format.'),
});
export type ForecastSpendingInput = z.infer<typeof ForecastSpendingInputSchema>;

const ForecastSpendingOutputSchema = z.object({
  predictedLimit: z
    .string()
    .describe('Predicted daily or weekly spending limit to stay on track.'),
  alerts: z.string().describe('Proactive alerts based on spending trends.'),
});
export type ForecastSpendingOutput = z.infer<typeof ForecastSpendingOutputSchema>;

export async function forecastSpending(input: ForecastSpendingInput): Promise<ForecastSpendingOutput> {
  return forecastSpendingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'forecastSpendingPrompt',
  input: {schema: ForecastSpendingInputSchema},
  output: {schema: ForecastSpendingOutputSchema},
  prompt: `You are Kwik Kash's proactive financial analyst. Your job is to analyze a user's spending habits, compare them against their income and goals, and provide a forward-looking spending limit and actionable alerts.

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

## Seasonal Trends to Consider:
{{{seasonalTrends}}}

## Your Task:
Based on all the information above, perform the following analysis and generate the required output.

1.  **Analyze Spending Patterns:** Look at the user's recent spending. Identify the top 3 categories where they spend the most. Note any unusually high spending days or categories.
2.  **Compare to Goals:** Assess if the current spending patterns are sustainable given their savings goals. For example, is high discretionary spending in one area jeopardizing their ability to meet their monthly contribution targets?
3.  **Generate a Predicted Limit:** Based on their income, goals, and recent spending, calculate and recommend a safe **daily spending limit** for the upcoming week to help them stay on track. This should be a specific number.
4.  **Create Proactive Alerts:** Generate a concise, actionable alert based on your analysis. The alert should highlight a specific spending habit and connect it to a potential impact on a financial goal.

**Example Alert:** "Your spending on 'Food & Dining' has been 20% higher than average this week. Scaling this back could help you reach your 'New Laptop' goal faster."

Now, generate the 'predictedLimit' and 'alerts' based on your analysis of the user's data.`,
});

const forecastSpendingFlow = ai.defineFlow(
  {
    name: 'forecastSpendingFlow',
    inputSchema: ForecastSpendingInputSchema,
    outputSchema: ForecastSpendingOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI model returned no output for spending forecast.');
      }
      return output;
    } catch (error) {
      console.error('Error in forecastSpendingFlow:', error);
      return {
        predictedLimit: 'Could not generate a forecast at this time.',
        alerts: 'The AI service is temporarily unavailable. Please try again later.',
      };
    }
  }
);
