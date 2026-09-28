import { NextResponse } from 'next/server';
import { checkHindsightHealth } from '@/lib/hindsight';
import { checkGroqHealth } from '@/lib/groq';

export async function GET() {
  const [hindsight, groq] = await Promise.allSettled([
    checkHindsightHealth(),
    checkGroqHealth(),
  ]);

  const hindsightResult =
    hindsight.status === 'fulfilled' ? hindsight.value : { ok: false, error: String(hindsight.reason) };
  const groqResult =
    groq.status === 'fulfilled' ? groq.value : { ok: false, model: 'unknown', error: String(groq.reason) };

  return NextResponse.json({
    hindsight: hindsightResult,
    groq: groqResult,
    timestamp: new Date().toISOString(),
  });
}
