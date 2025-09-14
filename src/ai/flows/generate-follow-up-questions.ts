'use server';

/**
 * @fileOverview A flow that generates follow-up questions based on initial problem statements.
 *
 * - generateFollowUpQuestions - A function that generates follow-up questions.
 * - GenerateFollowUpQuestionsInput - The input type for the generateFollowUpQuestions function.
 * - GenerateFollowUpQuestionsOutput - The return type for the generateFollowUpQuestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateFollowUpQuestionsInputSchema = z.object({
  problemA: z.string().describe("User A's description of the problem."),
  problemB: z.string().describe("User B's description of the problem."),
  exampleA: z
    .string()
    .describe('A specific example from User A related to the problem.'),
  exampleB: z
    .string()
    .describe('A specific example from User B related to the problem.'),
});

export type GenerateFollowUpQuestionsInput = z.infer<
  typeof GenerateFollowUpQuestionsInputSchema
>;

const GenerateFollowUpQuestionsOutputSchema = z.object({
  questions: z
    .array(z.string())
    .describe(
      'An array of 3 to 5 open-ended follow-up questions to help understand the core issue.'
    ),
});

export type GenerateFollowUpQuestionsOutput = z.infer<
  typeof GenerateFollowUpQuestionsOutputSchema
>;

export async function generateFollowUpQuestions(
  input: GenerateFollowUpQuestionsInput
): Promise<GenerateFollowUpQuestionsOutput> {
  return generateFollowUpQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFollowUpQuestionsPrompt',
  input: {schema: GenerateFollowUpQuestionsInputSchema},
  output: {schema: GenerateFollowUpQuestionsOutputSchema},
  prompt: `You are an AI relationship counselor. Your goal is to understand the root of a problem between two partners. You have their initial statements and a specific example from each.

Based on this information, generate 3 to 5 open-ended follow-up questions to probe deeper into their feelings, communication patterns, and underlying needs. The questions should encourage reflection, not place blame.

User A's problem: {{{problemA}}}
User A's example: {{{exampleA}}}

User B's problem: {{{problemB}}}
User B's example: {{{exampleB}}}
  `,
});

const generateFollowUpQuestionsFlow = ai.defineFlow(
  {
    name: 'generateFollowUpQuestionsFlow',
    inputSchema: GenerateFollowUpQuestionsInputSchema,
    outputSchema: GenerateFollowUpQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
