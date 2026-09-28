import { NextRequest, NextResponse } from 'next/server';
import { getMerchantPlaybook, createOrRefreshPlaybook, reflectOnMemories, PLAYBOOK_SOURCE_QUERY } from '@/lib/hindsight';

export async function GET() {
  try {
    // Try to get existing mental model first
    const playbook = await getMerchantPlaybook();

    if (playbook && playbook.content) {
      return NextResponse.json({
        source: 'mental_model',
        name: playbook.name,
        content: playbook.content,
        status: playbook.status ?? 'ready',
        timestamp: new Date().toISOString(),
      });
    }

    // Fallback: live reflection if mental model not available
    try {
      const reflection = await reflectOnMemories(PLAYBOOK_SOURCE_QUERY);
      return NextResponse.json({
        source: 'live_reflection',
        name: 'Merchant Dispute Playbook',
        content: reflection.text,
        status: 'live',
        label: 'Live reflection (mental model not yet generated)',
        timestamp: new Date().toISOString(),
      });
    } catch (reflectErr) {
      return NextResponse.json({
        source: 'unavailable',
        name: 'Merchant Dispute Playbook',
        content: null,
        status: 'unavailable',
        error: reflectErr instanceof Error ? reflectErr.message : 'Reflection unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err: unknown) {
    console.error('[playbook GET]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action !== 'refresh') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const result = await createOrRefreshPlaybook();

    return NextResponse.json({
      success: true,
      status: 'queued',
      operationId: result.operationId,
      message: 'Playbook refresh queued — mental model generation is asynchronous. Check back shortly.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[playbook POST]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
