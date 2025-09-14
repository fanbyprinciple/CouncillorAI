import { config } from 'dotenv';
config();

import '@/ai/flows/generate-counselor-advice.ts';
import '@/ai/flows/summarize-chat-history.ts';
import '@/ai/flows/generate-initial-questions.ts';
import '@/ai/flows/generate-actionable-steps.ts';
import '@/ai/flows/generate-follow-up-questions.ts';
