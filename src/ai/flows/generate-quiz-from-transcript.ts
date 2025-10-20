
'use server';

/**
 * @fileOverview An AI agent for generating quizzes from video transcripts.
 *
 * - generateQuizFromTranscript - A function to generate quiz questions from a YouTube video transcript.
 * - GenerateQuizInput - Input type for the function (YouTube URL).
 * - GenerateQuizOutput - Output type for the function (structured quiz data).
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { YoutubeTranscript } from 'youtube-transcript';

const GenerateQuizInputSchema = z.object({
  videoUrl: z.string().url().describe('The URL of the YouTube video.'),
});
export type GenerateQuizInput = z.infer<typeof GenerateQuizInputSchema>;

const QuizQuestionSchema = z.object({
    question: z.string().describe("The quiz question."),
    options: z.array(z.string()).describe("An array of 3-4 possible answers."),
    correctAnswer: z.string().describe("The correct answer from the options."),
});

const GenerateQuizOutputSchema = z.object({
  questions: z.array(QuizQuestionSchema).describe('An array of 5-7 quiz questions.'),
});
export type GenerateQuizOutput = z.infer<typeof GenerateQuizOutputSchema>;


// Define a tool to fetch the transcript from a YouTube video.
const getYouTubeTranscriptTool = ai.defineTool(
    {
        name: 'getYouTubeTranscript',
        description: 'Fetches the transcript of a given YouTube video URL.',
        inputSchema: z.object({ videoUrl: z.string().url() }),
        outputSchema: z.string(),
    },
    async ({ videoUrl }) => {
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
            return transcript.map(item => item.text).join(' ');
        } catch (error) {
            console.error('Failed to fetch transcript:', error);
            throw new Error('Could not retrieve transcript for the provided YouTube URL.');
        }
    }
);


const quizGenerationPrompt = ai.definePrompt({
    name: 'quizGenerationPrompt',
    inputSchema: z.object({ transcript: z.string() }),
    output: { schema: GenerateQuizOutputSchema },
    prompt: `You are a curriculum designer for an online learning platform.
Based on the following video transcript, please generate a quiz with 5 to 7 multiple-choice questions.
Each question should have 3 or 4 options, and you must clearly indicate the correct answer.
The quiz should test the key concepts and information presented in the video.

Video Transcript:
---
{{{transcript}}}
---
`,
});


export const generateQuizFromTranscriptFlow = ai.defineFlow(
  {
    name: 'generateQuizFromTranscriptFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async ({ videoUrl }) => {

    const transcriptResponse = await getYouTubeTranscriptTool({ videoUrl });
    
    if (!transcriptResponse) {
        throw new Error('Failed to get transcript');
    }

    const { output } = await quizGenerationPrompt({ transcript: transcriptResponse });
    
    if (!output) {
        throw new Error('Quiz generation failed.');
    }

    return output;
  }
);


export async function generateQuizFromTranscript(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
    return generateQuizFromTranscriptFlow(input);
}
