'use server';

import { generateCounselorAdvice } from '@/ai/flows/generate-counselor-advice';
import { generateInitialQuestions } from '@/ai/flows/generate-initial-questions';
import { z } from 'zod';

const adviceSchema = z.object({
  advice: z.string(),
});

export async function getAIAdvice(chatHistory: string): Promise<{ advice: string; error?: undefined } | { advice?: undefined; error: string }> {
  try {
    const result = await generateCounselorAdvice({ chatHistory });
    const parsedResult = adviceSchema.safeParse(result);

    if (!parsedResult.success) {
      console.error('Invalid AI response shape:', parsedResult.error);
      return { error: 'The AI returned an unexpected response. Please try again.' };
    }

    return { advice: parsedResult.data.advice };
  } catch (error) {
    console.error('Error getting AI advice:', error);
    return { error: 'An error occurred while getting advice from the AI.' };
  }
}

const questionsSchema = z.object({
    questions: z.array(z.string()),
});

export async function getInitialQuestions(topic: string): Promise<{ questions: string[]; error?: undefined } | { questions?: undefined; error: string }> {
    try {
        const result = await generateInitialQuestions({ topic });
        const parsedResult = questionsSchema.safeParse(result);

        if (!parsedResult.success) {
            console.error('Invalid AI response shape for questions:', parsedResult.error);
            return { error: 'The AI returned an unexpected response for questions. Please try again.' };
        }

        return { questions: parsedResult.data.questions };
    } catch (error) {
        console.error('Error getting initial questions:', error);
        return { error: 'An error occurred while getting initial questions from the AI.' };
    }
}
