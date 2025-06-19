'use server';

/**
 * @fileOverview A music track metadata suggestion AI agent.
 *
 * - suggestTrackMetadata - A function that handles the track metadata suggestion process.
 * - SuggestTrackMetadataInput - The input type for the suggestTrackMetadata function.
 * - SuggestTrackMetadataOutput - The return type for the suggestTrackMetadata function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestTrackMetadataInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio file, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestTrackMetadataInput = z.infer<typeof SuggestTrackMetadataInputSchema>;

const SuggestTrackMetadataOutputSchema = z.object({
  bpm: z.number().describe('The suggested BPM of the track.'),
  key: z.string().describe('The suggested key of the track.'),
});
export type SuggestTrackMetadataOutput = z.infer<typeof SuggestTrackMetadataOutputSchema>;

export async function suggestTrackMetadata(input: SuggestTrackMetadataInput): Promise<SuggestTrackMetadataOutput> {
  return suggestTrackMetadataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestTrackMetadataPrompt',
  input: {schema: SuggestTrackMetadataInputSchema},
  output: {schema: SuggestTrackMetadataOutputSchema},
  prompt: `You are an expert audio engineer specializing in music metadata analysis.

You will analyze the provided audio file and suggest its BPM and key.

Analyze the following audio file:

Audio: {{media url=audioDataUri}}`,
});

const suggestTrackMetadataFlow = ai.defineFlow(
  {
    name: 'suggestTrackMetadataFlow',
    inputSchema: SuggestTrackMetadataInputSchema,
    outputSchema: SuggestTrackMetadataOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
