'use server';
/**
 * @fileOverview An AI code review agent that provides feedback on code submissions.
 *
 * - reviewCodeAndProvideFeedback - A function that handles the code review process.
 * - ReviewCodeAndProvideFeedbackInput - The input type for the reviewCodeAndProvideFeedback function.
 * - ReviewCodeAndProvideFeedbackOutput - The return type for the reviewCodeAndProvideFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReviewCodeAndProvideFeedbackInputSchema = z.object({
  code: z.string().describe('The code to review.'),
  programmingLanguage: z
    .string()
    .describe('The programming language of the code.'),
});
export type ReviewCodeAndProvideFeedbackInput = z.infer<
  typeof ReviewCodeAndProvideFeedbackInputSchema
>;

const ReviewCodeAndProvideFeedbackOutputSchema = z.object({
  feedback: z.string().describe('The feedback on the code.'),
});
export type ReviewCodeAndProvideFeedbackOutput = z.infer<
  typeof ReviewCodeAndProvideFeedbackOutputSchema
>;

export async function reviewCodeAndProvideFeedback(
  input: ReviewCodeAndProvideFeedbackInput
): Promise<ReviewCodeAndProvideFeedbackOutput> {
  return reviewCodeAndProvideFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'reviewCodeAndProvideFeedbackPrompt',
  input: {schema: ReviewCodeAndProvideFeedbackInputSchema},
  output: {schema: ReviewCodeAndProvideFeedbackOutputSchema},
  prompt: `You are a playful and helpful AI code reviewer.

You will review the submitted code and provide instant, playful feedback to help the student learn from their mistakes quickly.
Specifically, identify errors like missing semicolons and other common mistakes.

Programming Language: {{{programmingLanguage}}}
Code: {{{code}}}`,
});

const reviewCodeAndProvideFeedbackFlow = ai.defineFlow(
  {
    name: 'reviewCodeAndProvideFeedbackFlow',
    inputSchema: ReviewCodeAndProvideFeedbackInputSchema,
    outputSchema: ReviewCodeAndProvideFeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
