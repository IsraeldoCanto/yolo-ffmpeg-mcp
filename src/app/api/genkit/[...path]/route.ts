
// import { appRoute } from '@genkit-ai/next';
import { NextRequest, NextResponse } from 'next/server';
// import '@/ai/flows/suggest-multimedia-metadata'; // Ensure flows are registered
// Ensure other flows are registered here if you have them, e.g. import '@/ai/flows/your-other-flow';

// const handler = appRoute({
//   // Add any required configuration here
// });

export async function GET(req: NextRequest) {
  return NextResponse.json({ status: 'Genkit route disabled' });
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ status: 'Genkit route disabled' });
}
