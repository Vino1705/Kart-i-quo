
'use server';
/**
 * @fileOverview AI-powered expense adjustment recommendations flow.
 *
 * - getExpenseAdjustmentRecommendations - A function that provides recommendations on how to adjust expenses to meet financial goals.
 * - ExpenseAdjustmentRecommendationsInput - The input type for the getExpenseAdjustmentRecommendations function.
 * - ExpenseAdjustmentRecommendationsOutput - The return type for the getExpenseAdjustmentRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExpenseAdjustmentRecommendationsInputSchema = z.object({
  income: z.number().describe('The user\u2019s total monthly income in Indian Rupees.'),
  fixedExpenses: z.array(
    z.object({
      name: z.string().describe('The name of the fixed expense.'),
      amount: z.number().describe('The amount of the fixed expense in Indian Rupees.'),
    })
  ).describe('A list of the user\u2019s fixed monthly expenses.'),
  goals: z.array(
    z.object({
      name: z.string().describe('The name of the financial goal.'),
      target: z.number().describe('The target amount for the financial goal in Indian Rupees.'),
      timelineMonths: z.number().describe('The timeline for the financial goal in months.'),
    })
  ).describe('A list of the user\u2019s financial goals.'),
  currentExpenses: z.array(
    z.object({
      name: z.string().describe('The name of the expense.'),
      amount: z.number().describe('The amount spent on the expense in Indian Rupees.'),
    })
  ).describe('A list of the user\u2019s current expenses.'),
  discretionarySpendingLimit: z.number().describe('The user\u2019s daily discretionary spending limit.'),
});

export type ExpenseAdjustmentRecommendationsInput = z.infer<
  typeof ExpenseAdjustmentRecommendationsInputSchema
>;

const ExpenseAdjustmentRecommendationsOutputSchema = z.object({
  recommendations: z
    .array(z.string())
    .describe('A list of recommendations on how to adjust expenses to meet financial goals.'),
});

export type ExpenseAdjustmentRecommendationsOutput = z.infer<
  typeof ExpenseAdjustmentRecommendationsOutputSchema
>;

export async function getExpenseAdjustmentRecommendations(
  input: ExpenseAdjustmentRecommendationsInput
): Promise<ExpenseAdjustmentRecommendationsOutput> {
  return expenseAdjustmentRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'expenseAdjustmentRecommendationsPrompt',
  input: {schema: ExpenseAdjustmentRecommendationsInputSchema},
  output: {schema: ExpenseAdjustmentRecommendationsOutputSchema},
  prompt: `You are a personal finance advisor helping users adjust their expenses to meet their financial goals.

  The user has the following income: ₹{{income}}

  The user has the following fixed expenses:
  {{#each fixedExpenses}}
  - {{name}}: ₹{{amount}}
  {{/each}}

  The user has the following financial goals:
  {{#each goals}}
  - {{name}}: ₹{{target}} in {{timelineMonths}} months
  {{/each}}

  The user has the following current expenses:
  {{#each currentExpenses}}
  - {{name}}: ₹{{amount}}
  {{/each}}

  The user has a daily discretionary spending limit of ₹{{discretionarySpendingLimit}}.

  Provide a list of specific and actionable recommendations on how the user can adjust their expenses to better meet their financial goals. Be mindful of the user's income, expenses, and goals when providing recommendations.
  Do not make recommendations that are not feasible or realistic.
  Do not recommend increasing income, only focus on decreasing expenses. Focus on the lowest hanging fruits. Only recommend small changes. Be concise. Focus on specific expenses the user has provided.
  The recommendations should be in the Indian context, where possible.
  The recommendations should be in bullet points.
  `,
});

const expenseAdjustmentRecommendationsFlow = ai.defineFlow(
  {
    name: 'expenseAdjustmentRecommendationsFlow',
    inputSchema: ExpenseAdjustmentRecommendationsInputSchema,
    outputSchema: ExpenseAdjustmentRecommendationsOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        throw new Error('AI model returned no output.');
      }
      return output;
    } catch (error) {
      console.error('Error in expenseAdjustmentRecommendationsFlow:', error);
      return {
        recommendations: [
          'Sorry, I am having trouble generating recommendations right now. Please try again in a moment.',
        ],
      };
    }
  }
);
