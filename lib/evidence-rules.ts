// Evidence rules — fully deterministic, no LLM involvement.
// Categories and availability are derived from case data only.

import type { DisputeReason } from './demo-data';

export interface EvidenceItem {
  id: string;
  label: string;
  category: string;
  available: boolean;
  missing: boolean;
  notes?: string;
}

export interface EvidenceChecklist {
  items: EvidenceItem[];
  presentCount: number;
  totalCount: number;
  completenessLabel: string; // e.g. "4 of 6 categories present"
}

// DL-2048 specific evidence mapping (deterministic from prompt spec)
const DL2048_EVIDENCE: EvidenceItem[] = [
  {
    id: 'order_receipt',
    label: 'Order confirmation / receipt',
    category: 'Order Documentation',
    available: true,
    missing: false,
    notes: 'Order A-8842 confirmed 2026-09-02',
  },
  {
    id: 'carrier_tracking',
    label: 'Carrier delivery scan',
    category: 'Carrier Evidence',
    available: true,
    missing: false,
    notes: 'GPS scan confirmed delivered 2026-09-06',
  },
  {
    id: 'delivery_location',
    label: 'GPS delivery location match',
    category: 'Delivery Corroboration',
    available: true,
    missing: false,
    notes: 'Delivery GPS coordinates matched shipping address',
  },
  {
    id: 'address_match',
    label: 'Billing / shipping address match',
    category: 'Address Verification',
    available: true,
    missing: false,
    notes: 'Billing and shipping address confirmed identical',
  },
  {
    id: 'customer_comms',
    label: 'Post-delivery support transcript (2026-09-08)',
    category: 'Customer Communications',
    available: true,
    missing: false,
    notes: 'Customer asked "How do I enable 144 Hz?" — 2 days after delivery',
  },
  {
    id: 'signed_receipt',
    label: 'Signed delivery receipt',
    category: 'Delivery Proof',
    available: false,
    missing: true,
    notes: 'Not available — carrier did not require signature',
  },
  {
    id: 'delivery_photo',
    label: 'Delivery photograph',
    category: 'Delivery Proof',
    available: false,
    missing: true,
    notes: 'Not available — carrier did not capture delivery photo',
  },
];

function buildChecklist(items: EvidenceItem[]): EvidenceChecklist {
  const presentCount = items.filter((i) => i.available).length;
  const totalCount = items.length;
  return {
    items,
    presentCount,
    totalCount,
    completenessLabel: `${presentCount} of ${totalCount} categories present`,
  };
}

// Generic evidence categories per reason (for non-golden cases)
const REASON_CATEGORIES: Record<DisputeReason, string[]> = {
  product_not_received: [
    'Order/Receipt',
    'Carrier Tracking',
    'Delivery Confirmation/Location',
    'Shipping/Billing Address Consistency',
    'Customer Communications',
    'Delivery Photo or Signed Receipt',
  ],
  fraudulent: [
    'AVS/CVV/3DS Authentication',
    'Device/IP/Access History',
    'Prior Customer Purchase History',
    'Transaction/Order Data',
    'Customer Communication',
  ],
  subscription_canceled: [
    'Accepted Subscription Terms',
    'Cancellation Record/Timestamp',
    'Renewal Notice',
    'Usage/Access After Renewal',
    'Cancellation/Refund Policy',
  ],
  duplicate: [
    'Both Transaction IDs',
    'Transaction Timestamps/Amounts',
    'Separate Order or Fulfillment Proof',
    'Refund Record (if applicable)',
  ],
  product_unacceptable: [
    'Product Description/Advertised Specs',
    'Condition/Quality Evidence',
    'Customer Communication',
    'Return/Refund Offer or Resolution Path',
    'Photos/Diagnostics (if available)',
  ],
};

export function getEvidenceChecklist(caseId: string, reason: DisputeReason): EvidenceChecklist {
  // Return the exact deterministic checklist for the golden case
  if (caseId === 'DL-2048') {
    return buildChecklist(DL2048_EVIDENCE);
  }

  // For other cases, generate a generic checklist from category labels
  const categories = REASON_CATEGORIES[reason] ?? [];
  const items: EvidenceItem[] = categories.map((label, idx) => ({
    id: `generic_${idx}`,
    label,
    category: label,
    available: false,
    missing: true,
    notes: 'Evidence status not loaded for this case',
  }));

  return buildChecklist(items);
}
