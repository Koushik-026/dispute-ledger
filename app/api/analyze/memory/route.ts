import { NextRequest, NextResponse } from 'next/server';
import { AnalyzeInputSchema, MemoryOnResultSchema } from '@/lib/schemas';
import { getDisputeById } from '@/lib/demo-data';
import { getEvidenceChecklist } from '@/lib/evidence-rules';
import { recallMemories, reflectOnMemories } from '@/lib/hindsight';
import { callGroq } from '@/lib/groq';
import {
  buildMemoryRecallQuery,
  buildMemoryReflectQuery,
  buildMemoryOnSystemPrompt,
} from '@/lib/prompts';

// Extract case IDs mentioned in recalled memory text
function extractCaseIds(text: string): string[] {
  const matches = text.match(/DL-\d{4}/g) ?? [];
  return Array.from(new Set(matches));
}

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

    // ── Step 1: Hindsight Recall ─────────────────────────────────────────────
    const recallQuery = buildMemoryRecallQuery(dispute, checklist);
    let recallResult;
    let hindsightError: string | null = null;

    try {
      recallResult = await recallMemories(recallQuery, 8);
    } catch (err: unknown) {
      hindsightError = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        {
          error: 'Hindsight Recall failed',
          hindsightError,
          hint: 'Check HINDSIGHT_API_KEY and ensure the bank has been seeded',
        },
        { status: 502 }
      );
    }

    // ── Step 2: Hindsight Reflect ────────────────────────────────────────────
    const reflectQuery = buildMemoryReflectQuery();
    let reflectResult;

    try {
      reflectResult = await reflectOnMemories(reflectQuery);
    } catch (err: unknown) {
      // Reflect failure is non-fatal — continue with recall only
      console.warn('[memory] Reflect failed:', err);
      reflectResult = { text: 'Reflection unavailable at this time.' };
    }

    // ── Step 3: Build context strings ────────────────────────────────────────
    const recalledContext = recallResult.memories
      .map((m, i) => `[Memory ${i + 1}] ${m.text}`)
      .join('\n\n');

    const recalledCaseIds = extractCaseIds(recalledContext);

    // ── Step 4: Groq generation ──────────────────────────────────────────────
    const systemPrompt = buildMemoryOnSystemPrompt(
      dispute,
      checklist,
      recalledContext || 'No relevant historical memories found.',
      reflectResult.text || 'No reflection available.'
    );

    let groqError: string | null = null;
    let analysisResult;

    try {
      const rawJson = await callGroq(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Provide your analysis as a JSON object.' },
        ],
        true // request JSON mode
      );

      const parsed = MemoryOnResultSchema.safeParse(JSON.parse(rawJson));
      if (parsed.success) {
        analysisResult = parsed.data;
      } else {
        // Attempt to use raw JSON anyway
        analysisResult = JSON.parse(rawJson);
      }
    } catch (err: unknown) {
      groqError = err instanceof Error ? err.message : String(err);
    }

    return NextResponse.json({
      caseId,
      mode: 'memory',
      label: 'Memory ON — Hindsight',
      checklist,
      recalledMemories: recallResult.memories,
      recalledCaseIds,
      reflectionText: reflectResult.text,
      analysis: analysisResult ?? null,
      groqError,
      hindsightError,
      memoryCount: recallResult.memories.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error('[memory]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 }
    );
  }
}
