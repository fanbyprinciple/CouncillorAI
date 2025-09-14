'use server';

/**
 * @fileOverview A flow that generates initial questions based on a topic.
 *
 * - generateInitialQuestions - A function that generates initial questions.
 * - GenerateInitialQuestionsInput - The input type for the generateInitialQuestions function.
 * - GenerateInitialQuestionsOutput - The return type for the generateInitialQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInitialQuestionsInputSchema = z.object({
  topic: z.string().describe('The topic for which to generate initial questions.'),
});

export type GenerateInitialQuestionsInput = z.infer<
  typeof GenerateInitialQuestionsInputSchema
>;

const GenerateInitialQuestionsOutputSchema = z.object({
  questions: z
    .array(z.string())
    .describe('An array of initial questions based on the topic.'),
});

export type GenerateInitialQuestionsOutput = z.infer<
  typeof GenerateInitialQuestionsOutputSchema
>;

export async function generateInitialQuestions(
  input: GenerateInitialQuestionsInput
): Promise<GenerateInitialQuestionsOutput> {
  return generateInitialQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInitialQuestionsPrompt',
  input: {schema: GenerateInitialQuestionsInputSchema},
  output: {schema: GenerateInitialQuestionsOutputSchema},
  prompt: `You are an AI that generates initial questions based on a topic.

  Generate a few questions based on the provided topic that two partners can answer to start a conversation about the topic.

  Topic: {{{topic}}}
  `,
});

const generateInitialQuestionsFlow = ai.defineFlow(
  {
    name: 'generateInitialQuestionsFlow',
    inputSchema: GenerateInitialQuestionsInputSchema,
    outputSchema: GenerateInitialQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
