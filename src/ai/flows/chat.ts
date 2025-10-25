
'use server';
/**
 * @fileOverview A multi-modal chat AI agent.
 *
 * - chat - A function that handles streaming chat responses.
 * - ChatInput - The input type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { streamFlow } from '@genkit-ai/next';

const MessagePartSchema = z.object({
  text: z.string().optional(),
  media: z
    .object({
      contentType: z.string(),
      url: z.string(),
    })
    .optional(),
});

const ChatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.array(MessagePartSchema),
    })
  ),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async function* (input) {
    const { stream, response } = ai.generateStream({
      model: 'googleai/gemini-2.5-flash',
      prompt: {
        messages: input.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      },
    });

    for await (const chunk of stream) {
        // Just stream the text part
        if (chunk.text) {
            yield chunk.text;
        }
    }
  }
);

export async function chat(input: ChatInput) {
    return streamFlow(chatFlow, input);
}
