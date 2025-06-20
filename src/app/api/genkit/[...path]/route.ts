
import { appRoute } from '@genkit-ai/next';
import '@/ai/flows/suggest-multimedia-metadata'; // Ensure flows are registered
// Ensure other flows are registered here if you have them, e.g. import '@/ai/flows/your-other-flow';

export const {GET, POST} = appRoute();
