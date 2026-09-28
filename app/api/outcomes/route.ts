import { NextRequest, NextResponse } from 'next/server';
import { OutcomeInputSchema } from '@/lib/schemas';
import { getDisputeById } from '@/lib/demo-data';
import { getEvidenceChecklist } from '@/lib/evidence-rules';
import { retainMemory, recallMemories } from '@/lib/hindsight';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = OutcomeInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }

    const { caseId, outcome, notes } = parsed.data;
    const dispute = getDisputeById(caseId);
    if (!dispute) {
      return NextResponse.json({ error: `Case ${caseId} not found` }, { status: 404 });
    }

    const checklist = getEvidenceChecklist(caseId, dispute.reason);
    const availableEvidence = checklist.items
      .filter((i) => i.available)
      .map((i) => i.label)
      .join('; ');

    const resolvedDate = new Date().toISOString().split('T')[0];
    const outcomeUpper = outcome.toUpperCase();

    // Build canonical retained narrative (as per spec)
    const narrative = `[RESOLVED DISPUTE] case_id: ${caseId} reason: ${dispute.reason.replace(/_/g, '_')} issuer: ${dispute.issuer} network: ${dispute.network} amount: ${dispute.amount} ${dispute.currency} case_facts: ${dispute.productDescription}; dispute filed ${dispute.disputeOpenedDate}; carrier delivered ${dispute.carrierDeliveryDate ?? 'N/A'} evidence_used: ${availableEvidence || 'not specified'} strategy: evidence-led representment with available documentation outcome: ${outcomeUpper} recovered_amount: ${outcomeUpper === 'WON' ? dispute.amount : 0} ${dispute.currency} lesson: ${notes ? notes : `${outcomeUpper === 'WON' ? 'Evidence package was sufficient for representment' : 'Evidence package was insufficient — review gaps before next similar case'}`} resolved_at: ${resolvedDate}${notes ? ` additional_notes: ${notes}` : ''}`;

    // Retain to Hindsight
    try {
      await retainMemory({ content: narrative });
    } catch (err: unknown) {
      return NextResponse.json(
        {
          error: 'Hindsight Retain failed',
          details: err instanceof Error ? err.message : String(err),
          hint: 'Check HINDSIGHT_API_KEY and run seed:hindsight to initialize the bank',
        },
        { status: 502 }
      );
    }

    // Small verification recall (non-blocking, may lag due to indexing)
    let verificationStatus: 'verified' | 'indexing' | 'failed' = 'indexing';
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const recall = await recallMemories(`case_id: ${caseId}`, 3);
      const found = recall.memories.some((m) => m.text.includes(caseId));
      verificationStatus = found ? 'verified' : 'indexing';
    } catch {
      verificationStatus = 'indexing';
    }

    return NextResponse.json({
      success: true,
      caseId,
      outcome: outcomeUpper,
      retainedSummary: narrative.substring(0, 200) + '...',
      verificationStatus,
      message:
        verificationStatus === 'verified'
          ? 'Learning event stored and verified in Hindsight'
          : 'Learning event stored — indexing in progress',
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[outcomes]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
