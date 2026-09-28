import { NextRequest, NextResponse } from 'next/server';
import { OutcomeInputSchema } from '@/lib/schemas';
import { getDisputeById } from '@/lib/demo-data';
import { getEvidenceChecklist } from '@/lib/evidence-rules';
import { retainMemory, recallMemories, getHindsightClient, BANK_ID } from '@/lib/hindsight';

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

    const outcomeUpper = outcome.toUpperCase();
    const eventId = `outcome:${caseId}:v1`;

    // ─── IDEMPOTENCY CHECK ──────────────────────────────────────────────────────────
    // Determine whether this exact case outcome was already recorded to Hindsight
    try {
      const client = getHindsightClient();
      const existing = await client.listMemories(BANK_ID, { q: caseId });
      const matchingMemories = (existing.items ?? []).filter((item) => {
        const text = String(item.text ?? '').toUpperCase();
        return text.includes(caseId.toUpperCase()) && text.includes(outcomeUpper);
      });

      if (matchingMemories.length > 0) {
        return NextResponse.json({
          success: true,
          caseId,
          outcome: outcomeUpper,
          status: 'already_recorded',
          retainedSummary: `Learning event for ${caseId} (${outcomeUpper}) already exists in Hindsight`,
          verificationStatus: 'verified',
          message: 'Learning event stored and verified in Hindsight',
          timestamp: new Date().toISOString(),
        });
      }
    } catch (checkErr) {
      console.warn('[outcomes] Idempotency pre-check warning:', checkErr);
    }

    const checklist = getEvidenceChecklist(caseId, dispute.reason);
    const availableEvidence = checklist.items
      .filter((i) => i.available)
      .map((i) => i.label)
      .join('; ');

    const resolvedDate = new Date().toISOString().split('T')[0];

    // Build canonical retained narrative
    const narrative = `[RESOLVED DISPUTE] case_id: ${caseId} reason: ${dispute.reason.replace(/_/g, '_')} issuer: ${dispute.issuer} network: ${dispute.network} amount: ${dispute.amount} ${dispute.currency} case_facts: ${dispute.productDescription}; dispute filed ${dispute.disputeOpenedDate}; carrier delivered ${dispute.carrierDeliveryDate ?? 'N/A'} evidence_used: ${availableEvidence || 'not specified'} strategy: evidence-led representment with available documentation outcome: ${outcomeUpper} recovered_amount: ${outcomeUpper === 'WON' ? dispute.amount : 0} ${dispute.currency} lesson: ${notes ? notes : `${outcomeUpper === 'WON' ? 'Evidence package was sufficient for representment' : 'Evidence package was insufficient — review gaps before next similar case'}`} resolved_at: ${resolvedDate}${notes ? ` additional_notes: ${notes}` : ''}`;

    // Retain to Hindsight with documentId to ensure storage upsert
    try {
      await retainMemory({
        content: narrative,
        documentId: eventId,
      });
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

    // Small verification recall (non-blocking, real check)
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
      status: 'recorded',
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
