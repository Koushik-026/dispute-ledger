import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/hindsight';
import { MemorySearchInputSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = MemorySearchInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const result = await recallMemories(parsed.data.query, 10);
    return NextResponse.json({
      query: parsed.data.query,
      memories: result.memories,
      count: result.memories.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
