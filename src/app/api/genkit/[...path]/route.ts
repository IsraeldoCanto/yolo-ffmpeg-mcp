import {NextGenkit} from '@genkit-ai/next';
import '@/ai/flows/suggest-track-metadata'; // Ensure flows are registered

export const {GET, POST} = NextGenkit();
