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
  expensesData: z
    .string()
    .describe('Historical expenses data in JSON format.'),
  seasonalTrends: z
    .string()
    .describe('Seasonal trends data in JSON format.'),
});
export type ForecastSpendingInput = z.infer<typeof ForecastSpendingInputSchema>;

const ForecastSpendingOutputSchema = z.object({
  predictedLimit: z
    .string()
    .describe('Predicted daily/weekly spending limit to stay on track.'),
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
  prompt: `You are a personal financial advisor. Analyze the user's past spending and seasonal trends to predict future expense limits and send proactive alerts to help them stay on track with their budget.

Past Spending Data: {{{expensesData}}}
Seasonal Trends: {{{seasonalTrends}}}

Based on this information, provide:
- A predicted daily or weekly spending limit to help the user stay on track.
- Any proactive alerts based on spending trends (e.g., "10% over budget on dining - adjust for travel goal").
`,
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
      return output!;
    } catch (error) {
      console.error('Error in forecastSpendingFlow:', error);
      return {
        predictedLimit: 'Could not generate a forecast at this time.',
        alerts: 'The AI service is temporarily unavailable. Please try again later.',
      };
    }
  }
);
