import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeInputSchema } from '@/lib/schemas';
import { getDisputeById } from '@/lib/demo-data';
import { getEvidenceChecklist } from '@/lib/evidence-rules';
import { callGroq } from '@/lib/groq';
import { buildBaselinePrompt } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = AnalyzeInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { caseId } = parsed.data;
    const dispute = getDisputeById(caseId);
    if (!dispute) {
      return NextResponse.json({ error: `Case ${caseId} not found` }, { status: 404 });
    }

    const checklist = getEvidenceChecklist(caseId, dispute.reason);
    const prompt = buildBaselinePrompt(dispute, checklist);

    const response = await callGroq([
      { role: 'system', content: 'You are an expert chargeback analyst. Follow all grounding rules strictly.' },
      { role: 'user', content: prompt },
    ]);

    return NextResponse.json({
      caseId,
      mode: 'baseline',
      label: 'Stateless baseline — current case only',
      checklist,
      response,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[baseline]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
