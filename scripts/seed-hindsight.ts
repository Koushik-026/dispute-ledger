#!/usr/bin/env tsx
/**
 * seed-hindsight.ts
 * Seeds all 30 resolved disputes + Merchant Dispute Playbook mental model into Hindsight Cloud.
 * Idempotent: checks for existing case IDs before retaining.
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { HindsightClient } from '@vectorize-io/hindsight-client';
import { RESOLVED_DISPUTES } from '../lib/demo-data';

const BANK_ID = process.env.HINDSIGHT_BANK_ID ?? 'dispute-ledger-demo';
const BASE_URL = process.env.HINDSIGHT_BASE_URL ?? 'https://api.hindsight.vectorize.io';
const API_KEY = process.env.HINDSIGHT_API_KEY ?? '';
const PLAYBOOK_MODEL_NAME = 'Merchant Dispute Playbook';
const SEED_VERSION = 'v1.0';

async function main() {
  if (!API_KEY) {
    console.error('❌ HINDSIGHT_API_KEY is not set. Add it to .env.local');
    process.exit(1);
  }

  const client = new HindsightClient({ baseUrl: BASE_URL, apiKey: API_KEY });

  // ── 1. Ensure bank exists ──────────────────────────────────────────────────
  console.log(`\n🏦 Ensuring bank exists: ${BANK_ID}`);
  try {
    await client.createBank(BANK_ID, { name: 'Dispute Ledger Demo' });
    console.log(`  ✅ Bank created: ${BANK_ID}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('already') || msg.includes('409') || msg.includes('exists')) {
      console.log(`  ℹ️  Bank already exists: ${BANK_ID}`);
    } else {
      console.error(`  ❌ Failed to create bank: ${msg}`);
      throw err;
    }
  }

  // ── 2. Check seed sentinel to avoid duplication ────────────────────────────
  console.log(`\n🔍 Checking if ${SEED_VERSION} already seeded...`);
  let alreadySeeded = false;
  try {
    const sentinelCheck = await client.recall(BANK_ID, `SEED_SENTINEL ${SEED_VERSION} dispute-ledger`);
    if (sentinelCheck.results?.some((r: { text?: string }) => r.text?.includes(`SEED_SENTINEL ${SEED_VERSION}`))) {
      alreadySeeded = true;
      console.log(`  ℹ️  Seed ${SEED_VERSION} already present. Skipping bulk retain.`);
    }
  } catch {
    // Recall may fail if bank is empty — that's fine
  }

  // ── 3. Retain all resolved disputes ────────────────────────────────────────
  if (!alreadySeeded) {
    console.log(`\n📝 Retaining ${RESOLVED_DISPUTES.length} resolved disputes...`);

    // Batch into groups to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < RESOLVED_DISPUTES.length; i += batchSize) {
      const batch = RESOLVED_DISPUTES.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (d) => {
          const narrative = `[RESOLVED DISPUTE] case_id: ${d.id} reason: ${d.reason} issuer: ${d.issuer} network: ${d.network} amount: ${d.amount} ${d.currency} case_facts: ${d.caseFacts} evidence_used: ${d.evidenceUsed.join('; ')} strategy: ${d.strategy} outcome: ${d.outcome} recovered_amount: ${d.recoveredAmount} ${d.currency} lesson: ${d.lesson} resolved_at: ${d.resolvedDate}`;
          await client.retain(BANK_ID, narrative);
          console.log(`  ✅ ${d.id} — ${d.outcome}`);
        })
      );
      if (i + batchSize < RESOLVED_DISPUTES.length) {
        await new Promise((r) => setTimeout(r, 500)); // Brief pause between batches
      }
    }

    // Retain seed sentinel
    await client.retain(BANK_ID, `SEED_SENTINEL ${SEED_VERSION} dispute-ledger-demo all-cases-retained`);
    console.log(`\n  ✅ Seed sentinel written: ${SEED_VERSION}`);
  }

  // ── 4. Create mental model ─────────────────────────────────────────────────
  console.log(`\n🧠 Creating mental model: "${PLAYBOOK_MODEL_NAME}"...`);
  const sourceQuery = "Across this merchant's resolved disputes, what recurring patterns exist in dispute reasons, evidence combinations, failed strategies, successful strategies, and operational lessons? State uncertainty, avoid causal claims from small samples, and cite or name relevant case IDs when possible.";
  try {
    const resp = await fetch(`${BASE_URL}/v1/default/banks/${BANK_ID}/mental-models`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: PLAYBOOK_MODEL_NAME,
        source_query: sourceQuery,
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      console.log(`  ✅ Mental model created/queued (operation: ${data.operation_id ?? 'async'})`);
    } else {
      const errText = await resp.text();
      if (errText.includes('already') || errText.includes('exists')) {
        console.log(`  ℹ️  Mental model already exists`);
      } else {
        console.warn(`  ⚠️  Mental model creation: ${errText}`);
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`  ⚠️  Mental model creation request error: ${msg}`);
  }

  console.log(`\n🎉 Seeding complete!`);
  console.log(`   Bank: ${BANK_ID}`);
  console.log(`   Cases: ${RESOLVED_DISPUTES.length}`);
  console.log(`   Mental model: ${PLAYBOOK_MODEL_NAME}`);
  console.log(`\nNext step: run verify:hindsight to confirm golden recall works.\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
