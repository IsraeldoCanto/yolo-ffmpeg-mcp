
'use server';

/**
 * @fileOverview A multimedia item metadata suggestion AI agent.
 *
 * - suggestMultimediaMetadata - A function that handles the multimedia metadata suggestion process.
 * - SuggestMultimediaMetadataInput - The input type for the suggestMultimediaMetadata function.
 * - SuggestMultimediaMetadataOutput - The return type for the suggestMultimediaMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestMultimediaMetadataInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file (as a form of multimedia), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestMultimediaMetadataInput = z.infer<typeof SuggestMultimediaMetadataInputSchema>;

const SuggestMultimediaMetadataOutputSchema = z.object({
  bpm: z.number().describe('The suggested BPM of the audio content.'),
  key: z.string().describe('The suggested key of the audio content.'),
});
export type SuggestMultimediaMetadataOutput = z.infer<typeof SuggestMultimediaMetadataOutputSchema>;

export async function suggestMultimediaMetadata(input: SuggestMultimediaMetadataInput): Promise<SuggestMultimediaMetadataOutput> {
  return suggestMultimediaMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestMultimediaMetadataPrompt',
  input: {schema: SuggestMultimediaMetadataInputSchema},
  output: {schema: SuggestMultimediaMetadataOutputSchema},
  prompt: `You are an expert audio engineer specializing in music metadata analysis for multimedia items.

You will analyze the provided audio data and suggest its BPM and key.

Analyze the following audio data:

Audio: {{media url=audioDataUri}}`,
});

const suggestMultimediaMetadataFlow = ai.defineFlow(
  {
    name: 'suggestMultimediaMetadataFlow',
    inputSchema: SuggestMultimediaMetadataInputSchema,
    outputSchema: SuggestMultimediaMetadataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
