
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatTitleInputSchema = z.object({
  transcript: z.string().describe('The full transcript of the chat conversation, or just the first message.'),
});

const ChatTitleOutputSchema = z.object({
  title: z.string().describe('A very short, descriptive title for the chat (3-6 words max).'),
});

const titlePrompt = ai.definePrompt({
  name: 'generateChatTitlePrompt',
  input: { schema: ChatTitleInputSchema },
  output: { schema: ChatTitleOutputSchema },
  prompt: `You are an AI assistant that generates short, catchy titles for chat conversations.
Given the following transcript or first message, generate a title that is:
1. Concise (3-6 words max)
2. Descriptive of the main topic
3. Professional yet engaging
4. Focused on the user's intent

Do not use quotes in the title.
Do not use a period at the end.

Transcript:
---
{{{transcript}}}
---
`,
});

export async function generateChatTitle(transcript: string) {
  const { output } = await titlePrompt({ transcript });
  if (!output) {
    throw new Error('Failed to generate a chat title.');
  }
  return output.title;
}
