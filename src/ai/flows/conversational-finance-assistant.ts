'use server';

/**
 * @fileOverview An AI-powered chatbot for answering financial queries, simulating scenarios, and providing role-specific budgeting tips.
 *
 * - conversationalFinanceAssistant - A function that handles user interactions and provides financial advice.
 * - ConversationalFinanceAssistantInput - The input type for the conversationalFinanceAssistant function.
 * - ConversationalFinanceAssistantOutput - The return type for the conversationalFinanceAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ConversationalFinanceAssistantInputSchema = z.object({
  query: z.string().describe('The user query related to financial advice or scenario.'),
  role: z
    .enum(['Student', 'Professional', 'Housewife'])
    .describe('The user role for tailored advice.'),
  income: z.number().describe('The user income.'),
  fixedExpenses: z
    .array(
      z.object({
        name: z.string(),
        amount: z.number(),
      })
    )
    .describe('The user fixed expenses.'),
  dailySpendingLimit: z.number().describe('The user daily spending limit.'),
  savings: z.number().describe('The user savings.'),
});
export type ConversationalFinanceAssistantInput = z.infer<
  typeof ConversationalFinanceAssistantInputSchema
>;

const ConversationalFinanceAssistantOutputSchema = z.object({
  response: z.string().describe('The response from the AI chatbot.'),
});
export type ConversationalFinanceAssistantOutput = z.infer<
  typeof ConversationalFinanceAssistantOutputSchema
>;

export async function conversationalFinanceAssistant(
  input: ConversationalFinanceAssistantInput
): Promise<ConversationalFinanceAssistantOutput> {
  return conversationalFinanceAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'conversationalFinanceAssistantPrompt',
  input: {schema: ConversationalFinanceAssistantInputSchema},
  output: {schema: ConversationalFinanceAssistantOutputSchema},
  prompt: `You are a helpful AI assistant that provides financial advice, simulates spending scenarios, and offers role-specific budgeting tips.

You have access to the following information about the user:
- Role: {{{role}}}
- Income: {{{income}}}
- Fixed Expenses:
{{#each fixedExpenses}}
  - {{name}}: ₹{{amount}}
{{/each}}
- Daily Spending Limit: {{{dailySpendingLimit}}}
- Savings: {{{savings}}}

Respond to the user query based on this information and provide relevant and helpful advice. If the user asks to simulate a spending scenario, calculate the impact on their budget and savings. If the user asks for budgeting tips, provide role-specific recommendations.

User Query: {{{query}}}`,
});

const conversationalFinanceAssistantFlow = ai.defineFlow(
  {
    name: 'conversationalFinanceAssistantFlow',
    inputSchema: ConversationalFinanceAssistantInputSchema,
    outputSchema: ConversationalFinanceAssistantOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      return output!;
    } catch (error) {
      console.error('Error in conversationalFinanceAssistantFlow:', error);
      return {
        response:
          'Sorry, I am having trouble connecting to my knowledge base right now. Please try again in a moment.',
      };
    }
  }
);
