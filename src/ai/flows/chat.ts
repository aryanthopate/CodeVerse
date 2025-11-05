
'use server';
/**
 * @fileOverview A multi-modal chat AI agent.
 *
 * - chat - A function that handles streaming chat responses.
 * - ChatInput - The input type for the chat function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
<<<<<<< HEAD
import { createClient } from '@/lib/supabase/server';
=======
>>>>>>> db0a7395fa057f7870b1d6661ca8a18cfaee8594

const ChatInputSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      content: z.string(),
    })
  ),
<<<<<<< HEAD
  chatId: z.string().optional(),
=======
>>>>>>> db0a7395fa057f7870b1d6661ca8a18cfaee8594
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export async function chat(input: ChatInput): Promise<ReadableStream<Uint8Array>> {
    
    const history = input.messages.slice(0, -1);
    const latestMessage = input.messages[input.messages.length - 1];

<<<<<<< HEAD
    let analysisSummary = '';
    if (input.chatId) {
        const supabase = createClient();
        const { data: analysis } = await supabase
            .from('chat_analysis')
            .select('summary')
            .eq('chat_id', input.chatId)
            .single();
        if (analysis?.summary) {
            analysisSummary = `LONG-TERM MEMORY (Summary of entire conversation):\n${analysis.summary}\n---\n`;
        }
    }

    const { stream } = await ai.generateStream({
      model: 'googleai/gemini-2.5-flash',
      system: `${analysisSummary}You are a helpful and friendly AI assistant named Chatlify, part of the CodeVerse platform. Your purpose is to help users learn about programming and understand coding concepts.
=======
    const { stream, response } = await ai.generateStream({
      model: 'googleai/gemini-2.5-flash',
      system: `You are a helpful and friendly AI assistant named Chatlify, part of the CodeVerse platform. Your purpose is to help users learn about programming and understand coding concepts.
>>>>>>> db0a7395fa057f7870b1d6661ca8a18cfaee8594
- Always be encouraging and friendly.
- If asked who you are, introduce yourself as "Chatlify by CodeVerse".
- Use standard Markdown for formatting (e.g., **bold**, *italic*, lists, # H1, ## H2, ### H3).
- For code blocks, you MUST wrap them with [-----] and [-----]. Do not use markdown fences (\`\`\`).
Example:
This is some text.
[-----]
function hello() {
  console.log("Hello, World!");
}
[-----]
This is more text.`,
      prompt: latestMessage.content,
      history: history,
    });

<<<<<<< HEAD
    const encoder = new TextEncoder();
=======
>>>>>>> db0a7395fa057f7870b1d6661ca8a18cfaee8594
    const readableStream = new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of stream) {
                    const text = chunk.text;
                    if (text) {
<<<<<<< HEAD
                        controller.enqueue(encoder.encode(text));
                    }
                }
            } catch (e: any) {
                console.error("Streaming Error in chat flow:", e);
=======
                        controller.enqueue(new TextEncoder().encode(text));
                    }
                }
                await response; // Wait for the full response to be processed
            } catch (e: any) {
                console.error("Streaming Error:", e);
>>>>>>> db0a7395fa057f7870b1d6661ca8a18cfaee8594
                controller.error(e);
            } finally {
                controller.close();
            }
        },
    });

    return readableStream;
}
