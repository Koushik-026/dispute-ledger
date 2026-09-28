// Prompt templates for Dispute Ledger analysis

import type { OpenDispute } from './demo-data';
import type { EvidenceChecklist } from './evidence-rules';

export function buildBaselinePrompt(
  dispute: OpenDispute,
  checklist: EvidenceChecklist
): string {
  const availableEvidence = checklist.items
    .filter((i) => i.available)
    .map((i) => `- ${i.label}${i.notes ? ': ' + i.notes : ''}`)
    .join('\n');

  const missingEvidence = checklist.items
    .filter((i) => i.missing)
    .map((i) => `- ${i.label}`)
    .join('\n');

  return `You are a professional chargeback analyst preparing a representment response.
You have NO historical context. Analyze ONLY the current case facts provided.

GROUNDING RULES (mandatory):
- Never invent evidence. Never state a missing item exists.
- Use only current-case facts in the draft.
- Never say "will win", "guaranteed", or give a win probability.
- Draft is decision support, not legal or financial advice.
- Be concise and evidence-led.
- Add a note that this draft must be reviewed before submission.

CURRENT CASE:
Case ID: ${dispute.id}
Reason: ${dispute.reason.replace(/_/g, ' ')}
Amount: $${dispute.amount} ${dispute.currency}
Network: ${dispute.network}
Issuer: ${dispute.issuer}
Order ID: ${dispute.orderId}
Product: ${dispute.productDescription}
Transaction Date: ${dispute.transactionDate}
${dispute.carrierDeliveryDate ? `Carrier Delivery Date: ${dispute.carrierDeliveryDate}` : ''}
Dispute Opened: ${dispute.disputeOpenedDate}
Response Due: ${dispute.responseDueDate}

EVIDENCE CHECKLIST (${checklist.completenessLabel}):
Available:
${availableEvidence || 'None'}

Missing/unavailable:
${missingEvidence || 'None'}

Provide:
1. Recommended evidence priority (based only on what is available)
2. A concise representment draft (200-350 words, evidence-led, professional tone)
3. Key risks or gaps in the current evidence set

Format your response clearly with these three sections.`;
}

export function buildMemoryRecallQuery(dispute: OpenDispute, checklist: EvidenceChecklist): string {
  const availableEvidence = checklist.items
    .filter((i) => i.available)
    .map((i) => i.label)
    .join(', ');

  return `I need to recall resolved dispute cases to inform strategy for a new ${dispute.reason.replace(/_/g, ' ')} dispute. 
Case amount: $${dispute.amount}. Network: ${dispute.network}. Issuer: ${dispute.issuer}.
Available evidence: ${availableEvidence}.
What resolved cases demonstrate which evidence combinations won or lost, particularly for ${dispute.reason.replace(/_/g, ' ')} disputes? 
Especially interested in: post-delivery customer interaction as possession evidence, GPS-matched delivery records, tracking-only submissions, and address consistency cases.`;
}

export function buildMemoryReflectQuery(): string {
  return `Across this merchant's resolved disputes, synthesize: 
(1) Which evidence combinations consistently won for product-not-received disputes?
(2) What was weak about lost cases — specifically was tracking-only ever sufficient?
(3) What does post-delivery customer interaction (support contact, warranty inquiry) indicate about possession?
(4) Any patterns with Northstar Bank specifically?
State your uncertainty clearly. Do not make absolute causal claims from small samples.`;
}

export function buildMemoryOnSystemPrompt(
  dispute: OpenDispute,
  checklist: EvidenceChecklist,
  recalledContext: string,
  reflectionContext: string
): string {
  const availableEvidence = checklist.items
    .filter((i) => i.available)
    .map((i) => `- ${i.label}${i.notes ? ': ' + i.notes : ''}`)
    .join('\n');

  const missingEvidence = checklist.items
    .filter((i) => i.missing)
    .map((i) => `- ${i.label}`)
    .join('\n');

  return `You are a professional chargeback analyst with access to the merchant's resolved dispute history through Hindsight memory.

CRITICAL GROUNDING RULES (mandatory — no exceptions):
- Never invent evidence. Never state a missing evidence item exists.
- Historical cases are ADVISORY CONTEXT ONLY. Do NOT write them into the new dispute as evidence.
- Use ONLY current-case facts in the representment draft.
- Historical cases may change prioritization and reasoning, not the factual content of the draft.
- Never say "will win", "guaranteed", or give a win probability.
- Do not claim the issuer has a preference based on 1-2 cases — say "in this merchant's limited history..."
- If fewer than 3 relevant cases exist, explicitly label precedent as sparse.
- Draft is decision support — not legal or financial advice. Include a review disclaimer.
- Keep the draft concise, professional, and evidence-led. Not emotional or accusatory.

CURRENT CASE:
Case ID: ${dispute.id}
Reason: ${dispute.reason.replace(/_/g, ' ')}
Amount: $${dispute.amount} ${dispute.currency}
Network: ${dispute.network}
Issuer: ${dispute.issuer}
Order ID: ${dispute.orderId}
Product: ${dispute.productDescription}
Transaction Date: ${dispute.transactionDate}
${dispute.carrierDeliveryDate ? `Carrier Delivery Date: ${dispute.carrierDeliveryDate}` : ''}
Dispute Opened: ${dispute.disputeOpenedDate}
Response Due: ${dispute.responseDueDate}

EVIDENCE CHECKLIST (${checklist.completenessLabel}):
Available:
${availableEvidence || 'None'}

Missing/unavailable:
${missingEvidence || 'None'}

HISTORICAL MERCHANT MEMORY — GUIDANCE ONLY (not evidence for this dispute):
${recalledContext}

MERCHANT PATTERN REFLECTION:
${reflectionContext}

Respond with a JSON object exactly matching this schema:
{
  "summary": "2-3 sentence strategic summary",
  "recommended_evidence": [
    {"type": "evidence name", "why": "reason based on history or logic", "supported_by": ["DL-XXXX"]}
  ],
  "deprioritize": [
    {"type": "evidence name", "why": "reason", "supported_by": ["DL-XXXX"]}
  ],
  "historical_patterns": ["pattern string"],
  "caveats": ["caveat string"],
  "draft_focus": ["key point for draft"],
  "draft": "The complete representment draft text (200-350 words). Must use ONLY current case facts. Must include disclaimer."
}`;
}
