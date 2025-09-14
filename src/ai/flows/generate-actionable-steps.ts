'use server';

/**
 * @fileOverview An AI flow for generating actionable steps based on chat history.
 *
 * - generateActionableSteps - A function that takes chat history and provides a bulleted list of actionable steps.
 * - GenerateActionableStepsInput - The input type for the generateActionableSteps function.
 * - GenerateActionableStepsOutput - The return type for the generateActionableSteps function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateActionableStepsInputSchema = z.object({
  chatHistory: z
    .string()
    .describe('The complete chat history, including initial answers and follow-up discussion.'),
});
export type GenerateActionableStepsInput = z.infer<typeof GenerateActionableStepsInputSchema>;

const GenerateActionableStepsOutputSchema = z.object({
  steps: z
    .string()
    .describe(
      'A step-by-step, bulleted list of actionable steps for the couple to take. Each step should be a separate bullet point.'
    ),
});
export type GenerateActionableStepsOutput = z.infer<typeof GenerateActionableStepsOutputSchema>;

export async function generateActionableSteps(
  input: GenerateActionableStepsInput
): Promise<GenerateActionableStepsOutput> {
  return generateActionableStepsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateActionableStepsPrompt',
  input: {schema: GenerateActionableStepsInputSchema},
  output: {schema: GenerateActionableStepsOutputSchema},
  prompt: `You are an experienced marriage counselor. Based on the entire conversation history provided below, create a simple, clear, and actionable plan for the couple. Present this plan as a bulleted list (using '*' or '-').

Chat History:
{{{chatHistory}}}`,
});

const generateActionableStepsFlow = ai.defineFlow(
  {
    name: 'generateActionableStepsFlow',
    inputSchema: GenerateActionableStepsInputSchema,
    outputSchema: GenerateActionableStepsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
