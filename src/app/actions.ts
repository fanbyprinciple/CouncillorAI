'use server';

import { generateCounselorAdvice } from '@/ai/flows/generate-counselor-advice';
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
