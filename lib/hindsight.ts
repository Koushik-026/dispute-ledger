// Hindsight Cloud integration layer
// Uses @vectorize-io/hindsight-client (TypeScript SDK)
// REST API fallback: POST /v1/default/banks/{bankId}/memories etc.

import { HindsightClient } from '@vectorize-io/hindsight-client';

const BANK_ID = process.env.HINDSIGHT_BANK_ID ?? 'dispute-ledger-demo';
const BASE_URL = process.env.HINDSIGHT_BASE_URL ?? 'https://api.hindsight.vectorize.io';
const API_KEY = process.env.HINDSIGHT_API_KEY ?? '';

export function getHindsightClient(): HindsightClient {
  if (!API_KEY) {
    throw new Error('HINDSIGHT_API_KEY is not set');
  }
  return new HindsightClient({ baseUrl: BASE_URL, apiKey: API_KEY });
}

export { BANK_ID };

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────────

export async function checkHindsightHealth(): Promise<{ ok: boolean; error?: string }> {
  if (!API_KEY) {
    return { ok: false, error: 'HINDSIGHT_API_KEY not configured' };
  }
  try {
    const res = await fetch(`${BASE_URL}/v1/default/banks`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return { ok: false, error: `Hindsight API returned ${res.status}` };
    }
    return { ok: true };
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// ─── ENSURE BANK EXISTS ──────────────────────────────────────────────────────────

export async function ensureBankExists(): Promise<void> {
  if (!API_KEY) throw new Error('HINDSIGHT_API_KEY not set');
  const client = getHindsightClient();
  try {
    await client.createBank(BANK_ID, { name: 'Dispute Ledger Demo' });
  } catch (err: unknown) {
    // Bank may already exist — ignore "already exists" type errors
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('already') && !msg.includes('409') && !msg.includes('exists')) {
      throw err;
    }
  }
}

// ─── RETAIN ─────────────────────────────────────────────────────────────────────

export interface RetainOptions {
  content: string;
  context?: string;
  documentId?: string;
}

export async function retainMemory(opts: RetainOptions): Promise<void> {
  const client = getHindsightClient();
  await client.retain(BANK_ID, opts.content, {
    context: opts.context,
    documentId: opts.documentId,
  });
}

// ─── RECALL ─────────────────────────────────────────────────────────────────────

export interface RecallMemory {
  text: string;
  id?: string;
  score?: number;
}

export interface RecallResponse {
  memories: RecallMemory[];
  raw?: unknown;
}

export async function recallMemories(query: string, topK = 8): Promise<RecallResponse> {
  const client = getHindsightClient();
  const result = await client.recall(BANK_ID, query);
  const memories: RecallMemory[] = (result.results ?? [])
    .slice(0, topK)
    .map((r: { text?: string; id?: string; score?: number }) => ({
      text: r.text ?? '',
      id: r.id,
      score: r.score,
    }));
  return { memories, raw: result };
}

// ─── REFLECT ────────────────────────────────────────────────────────────────────

export interface ReflectResponse {
  text: string;
  raw?: unknown;
}

export async function reflectOnMemories(query: string): Promise<ReflectResponse> {
  try {
    const client = getHindsightClient();
    const result = await client.reflect(BANK_ID, query);
    if (result?.text) {
      return { text: result.text, raw: result };
    }
  } catch (err) {
    console.warn('[reflectOnMemories] SDK reflect failed:', err);
  }

  // Direct REST fallback
  if (API_KEY) {
    try {
      const res = await fetch(`${BASE_URL}/v1/default/banks/${BANK_ID}/reflect`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, budget: 'low' }),
      });
      if (res.ok) {
        const data = await res.json();
        return { text: data.text ?? '', raw: data };
      }
    } catch (err) {
      console.warn('[reflectOnMemories] REST reflect fallback failed:', err);
    }
  }

  return { text: '', raw: null };
}

// ─── MENTAL MODELS ───────────────────────────────────────────────────────────────

export const PLAYBOOK_MODEL_NAME = 'Merchant Dispute Playbook';
export const PLAYBOOK_SOURCE_QUERY =
  "Across this merchant's resolved disputes, what recurring patterns exist in dispute reasons, evidence combinations, failed strategies, successful strategies, and operational lessons? State uncertainty, avoid causal claims from small samples, and cite or name relevant case IDs when possible.";

export interface MentalModel {
  id?: string;
  name: string;
  content: string;
  status?: string;
}

export async function listMentalModels(): Promise<MentalModel[]> {
  if (!API_KEY) throw new Error('HINDSIGHT_API_KEY is not set');
  const res = await fetch(`${BASE_URL}/v1/default/banks/${BANK_ID}/mental-models`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to list mental models: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return (data.items ?? []).map((m: { id?: string; name?: string; content?: string; status?: string }) => ({
    id: m.id,
    name: m.name ?? '',
    content: m.content ?? '',
    status: m.status,
  }));
}

export async function getMentalModel(id: string): Promise<MentalModel | null> {
  if (!API_KEY) throw new Error('HINDSIGHT_API_KEY is not set');
  const res = await fetch(`${BASE_URL}/v1/default/banks/${BANK_ID}/mental-models/${id}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    id: data.id,
    name: data.name ?? '',
    content: data.content || data.reflect_response?.text || '',
    status: data.status ?? 'ready',
  };
}

export async function getMerchantPlaybook(): Promise<MentalModel | null> {
  try {
    const models = await listMentalModels();
    const found = models.find((m) => m.name === PLAYBOOK_MODEL_NAME);
    if (!found) return null;
    if (found.content) return found;
    if (found.id) {
      const detail = await getMentalModel(found.id);
      if (detail && detail.content) return detail;
    }
    return found;
  } catch {
    return null;
  }
}

export async function createOrRefreshPlaybook(): Promise<{ operationId?: string }> {
  if (!API_KEY) throw new Error('HINDSIGHT_API_KEY is not set');
  
  try {
    const existing = await listMentalModels();
    const found = existing.find((m) => m.name === PLAYBOOK_MODEL_NAME);
    if (found && found.id) {
      const refreshRes = await fetch(`${BASE_URL}/v1/default/banks/${BANK_ID}/mental-models/${found.id}/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        return { operationId: data.operation_id ?? data.operationId };
      }
    }
  } catch {
    // Fall through to create
  }

  const res = await fetch(`${BASE_URL}/v1/default/banks/${BANK_ID}/mental-models`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: PLAYBOOK_MODEL_NAME,
      source_query: PLAYBOOK_SOURCE_QUERY,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to create mental model: ${res.status} ${errText}`);
  }
  const data = await res.json();
  return { operationId: data.operation_id ?? data.operationId };
}

