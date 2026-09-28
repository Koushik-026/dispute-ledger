#!/usr/bin/env tsx
/**
 * verify-hindsight.ts
 * Verifies the Hindsight bank is reachable, golden cases recall correctly,
 * and the mental model exists.
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { HindsightClient } from '@vectorize-io/hindsight-client';

const BANK_ID = process.env.HINDSIGHT_BANK_ID ?? 'dispute-ledger-demo';
const BASE_URL = process.env.HINDSIGHT_BASE_URL ?? 'https://api.hindsight.vectorize.io';
const API_KEY = process.env.HINDSIGHT_API_KEY ?? '';
const PLAYBOOK_MODEL_NAME = 'Merchant Dispute Playbook';

const GOLDEN_CASES = ['DL-1107', 'DL-1089', 'DL-1142'];
const GOLDEN_QUERY = 'product not received Northstar Bank carrier delivered post-delivery support interaction tracking evidence';

let passed = 0;
let failed = 0;

function ok(msg: string) {
  console.log(`  ✅ ${msg}`);
  passed++;
}

function fail(msg: string) {
  console.error(`  ❌ ${msg}`);
  failed++;
}

function warn(msg: string) {
  console.warn(`  ⚠️  ${msg}`);
}

async function main() {
  if (!API_KEY) {
    console.error('❌ HINDSIGHT_API_KEY not set');
    process.exit(1);
  }

  const client = new HindsightClient({ baseUrl: BASE_URL, apiKey: API_KEY });

  // ── 1. Bank reachable ──────────────────────────────────────────────────────
  console.log('\n[1/4] Checking bank reachability...');
  try {
    const resp = await fetch(`${BASE_URL}/v1/default/banks`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
    ok(`API reachable — bank: ${BANK_ID}`);
  } catch (err: unknown) {
    fail(`Cannot reach Hindsight API: ${err instanceof Error ? err.message : err}`);
    console.error('\nDiagnostics:');
    console.error('  - Check HINDSIGHT_API_KEY is valid');
    console.error('  - Check HINDSIGHT_BASE_URL is correct');
    console.error('  - Run: curl -H "Authorization: Bearer $HINDSIGHT_API_KEY" https://api.hindsight.vectorize.io/v1/default/banks');
    process.exit(1);
  }

  // ── 2. Golden recall ───────────────────────────────────────────────────────
  console.log('\n[2/4] Testing golden recall for DL-2048 query...');
  try {
    const result = await client.recall(BANK_ID, GOLDEN_QUERY);
    const recalled = result.results ?? [];
    console.log(`  Retrieved ${recalled.length} memories`);

    const foundCases: string[] = [];
    for (const caseId of GOLDEN_CASES) {
      const found = recalled.some((m: { text?: string }) => m.text?.includes(caseId));
      if (found) {
        ok(`${caseId} recalled`);
        foundCases.push(caseId);
      } else {
        warn(`${caseId} not in top results — may need re-seeding or more indexing time`);
      }
    }

    if (foundCases.length >= 2) {
      ok(`Golden recall sufficient (${foundCases.length}/${GOLDEN_CASES.length} key cases found)`);
    } else {
      fail(`Golden recall insufficient — run seed:hindsight and wait for indexing`);
    }
  } catch (err: unknown) {
    fail(`Recall failed: ${err instanceof Error ? err.message : err}`);
    console.error('  Hint: Ensure seed:hindsight has been run and indexing completed');
  }

  // ── 3. Mental model check ──────────────────────────────────────────────────
  console.log('\n[3/4] Checking Merchant Dispute Playbook mental model...');
  try {
    const resp = await fetch(`${BASE_URL}/v1/default/banks/${BANK_ID}/mental-models`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${await resp.text()}`);
    const models = await resp.json();
    const playbook = (models.items ?? []).find((m: { name?: string }) => m.name === PLAYBOOK_MODEL_NAME);
    if (playbook) {
      ok(`Mental model "${PLAYBOOK_MODEL_NAME}" exists (status: ${playbook.status ?? 'unknown'})`);
      if (playbook.content) {
        ok(`Mental model has content (${playbook.content.length} chars)`);
      } else {
        warn(`Mental model exists but content is empty — may still be processing`);
      }
    } else {
      fail(`Mental model "${PLAYBOOK_MODEL_NAME}" not found — run seed:hindsight`);
    }
  } catch (err: unknown) {
    fail(`listMentalModels failed: ${err instanceof Error ? err.message : err}`);
  }

  // ── 4. Reflect test ────────────────────────────────────────────────────────
  console.log('\n[4/4] Testing Reflect endpoint...');
  try {
    const reflection = await client.reflect(BANK_ID, 'What patterns exist for product not received disputes?');
    if (reflection.text && reflection.text.length > 50) {
      ok(`Reflect returned ${reflection.text.length} chars`);
    } else {
      warn(`Reflect returned short/empty response — bank may have too few memories`);
    }
  } catch (err: unknown) {
    fail(`Reflect failed: ${err instanceof Error ? err.message : err}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('\n❌ Verification incomplete — fix errors above before deploying.');
    process.exit(1);
  } else {
    console.log('\n🎉 All checks passed — Hindsight is ready for DL-2048 golden demo!');
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
