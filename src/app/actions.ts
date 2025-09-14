'use server';

import {generateCounselorAdvice} from '@/ai/flows/generate-counselor-advice';
import {generateInitialQuestions} from '@/ai/flows/generate-initial-questions';
import {generateActionableSteps} from '@/ai/flows/generate-actionable-steps';
import {generateFollowUpQuestions} from '@/ai/flows/generate-follow-up-questions';
import {z} from 'zod';

const adviceSchema = z.object({
  advice: z.string(),
});

export async function getAIAdvice(
  chatHistory: string
): Promise<{advice: string; error?: undefined} | {advice?: undefined; error: string}> {
  try {
    const result = await generateCounselorAdvice({chatHistory});
    const parsedResult = adviceSchema.safeParse(result);

    if (!parsedResult.success) {
      console.error('Invalid AI response shape:', parsedResult.error);
      return {error: 'The AI returned an unexpected response. Please try again.'};
    }

    return {advice: parsedResult.data.advice};
  } catch (error) {
    console.error('Error getting AI advice:', error);
    return {error: 'An error occurred while getting advice from the AI.'};
  }
}

const questionsSchema = z.object({
  questions: z.array(z.string()),
});

export async function getInitialQuestions(
  topic: string
): Promise<{questions: string[]; error?: undefined} | {questions?: undefined; error: string}> {
  try {
    const result = await generateInitialQuestions({topic});
    const parsedResult = questionsSchema.safeParse(result);

    if (!parsedResult.success) {
      console.error('Invalid AI response shape for questions:', parsedResult.error);
      return {error: 'The AI returned an unexpected response for questions. Please try again.'};
    }

    const finalQuestions = [...parsedResult.data.questions];
    // Ensure the specific question is always included.
    const specificQuestion =
      'Please provide a specific example of a time you felt wronged or misunderstood in this situation.';
    if (!finalQuestions.includes(specificQuestion)) {
      finalQuestions.push(specificQuestion);
    }

    return {questions: finalQuestions};
  } catch (error) {
    console.error('Error getting initial questions:', error);
    return {error: 'An error occurred while getting initial questions from the AI.'};
  }
}

export async function getFollowUpQuestions(
  problemA: string,
  problemB: string,
  exampleA: string,
  exampleB: string
): Promise<{questions: string[]; error?: undefined} | {questions?: undefined; error: string}> {
  try {
    const result = await generateFollowUpQuestions({
      problemA,
      problemB,
      exampleA,
      exampleB,
    });
    const parsedResult = questionsSchema.safeParse(result);

    if (!parsedResult.success) {
      console.error('Invalid AI response shape for follow-up questions:', parsedResult.error);
      return {
        error: 'The AI returned an unexpected response for follow-up questions. Please try again.',
      };
    }
    return {questions: parsedResult.data.questions};
  } catch (error) {
    console.error('Error getting follow-up questions:', error);
    return {error: 'An error occurred while getting follow-up questions from the AI.'};
  }
}

const actionableStepsSchema = z.object({
  steps: z.string(),
});

export async function getActionableSteps(
  chatHistory: string
): Promise<{steps: string; error?: undefined} | {steps?: undefined; error: string}> {
  try {
    const result = await generateActionableSteps({chatHistory});
    const parsedResult = actionableStepsSchema.safeParse(result);

    if (!parsedResult.success) {
      console.error('Invalid AI response shape for actionable steps:', parsedResult.error);
      return {
        error: 'The AI returned an unexpected response for actionable steps. Please try again.',
      };
    }

    return {steps: parsedResult.data.steps};
  } catch (error) {
    console.error('Error getting actionable steps:', error);
    return {error: 'An error occurred while getting actionable steps from the AI.'};
  }
}
