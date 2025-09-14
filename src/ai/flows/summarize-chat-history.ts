'use server';

/**
 * @fileOverview Summarizes the chat history for the AI counselor.
 *
 * - summarizeChatHistory - A function that summarizes the chat history.
 * - SummarizeChatHistoryInput - The input type for the summarizeChatHistory function.
 * - SummarizeChatHistoryOutput - The return type for the summarizeChatHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeChatHistoryInputSchema = z.object({
  chatHistory: z
    .string()
    .describe('The complete chat history between the two users.'),
});
export type SummarizeChatHistoryInput = z.infer<typeof SummarizeChatHistoryInputSchema>;

const SummarizeChatHistoryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the chat history, highlighting key issues and concerns.'),
});
export type SummarizeChatHistoryOutput = z.infer<typeof SummarizeChatHistoryOutputSchema>;

export async function summarizeChatHistory(
  input: SummarizeChatHistoryInput
): Promise<SummarizeChatHistoryOutput> {
  return summarizeChatHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeChatHistoryPrompt',
  input: {schema: SummarizeChatHistoryInputSchema},
  output: {schema: SummarizeChatHistoryOutputSchema},
  prompt: `You are an expert summarizer, skilled at condensing long conversations into concise summaries.

  Please summarize the following chat history, highlighting the main issues and concerns discussed between the two users. The summary should be clear, and easy to understand.

  Chat History: {{{chatHistory}}}`,
});

const summarizeChatHistoryFlow = ai.defineFlow(
  {
    name: 'summarizeChatHistoryFlow',
    inputSchema: SummarizeChatHistoryInputSchema,
    outputSchema: SummarizeChatHistoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
