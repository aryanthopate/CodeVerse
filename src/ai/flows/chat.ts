'use server';
/**
 * @fileOverview A multi-modal chat AI agent.
 *
 * - chat - A function that handles streaming chat responses.
 * - ChatInput - The input type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ChatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export async function chat(input: ChatInput): Promise<ReadableStream<Uint8Array>> {
    
    const history = input.messages.slice(0, -1);
    const latestMessage = input.messages[input.messages.length - 1];

    const { stream, response } = await ai.generateStream({
      model: 'googleai/gemini-2.5-flash',
      system: `You are a helpful and friendly AI assistant named Chatlify.
- Use standard Markdown for formatting (e.g., **bold**, *italic*, lists).
- For code blocks, wrap them with [CODE_STARTED] and [CODE_ENDED]. Do not use markdown fences (\`\`\`).
Example:
[CODE_STARTED]
function hello() {
  console.log("Hello, World!");
}
[CODE_ENDED]`,
      prompt: latestMessage.content,
      history: history,
    });

    const readableStream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const text = chunk.text;
                    if (text) {
                        controller.enqueue(new TextEncoder().encode(text));
                    }
                }
                await response; // Wait for the full response to be processed
            } catch (e: any) {
                console.error("Streaming Error:", e);
                controller.error(e);
            } finally {
                controller.close();
            }
        },
    });

    return readableStream;
}
