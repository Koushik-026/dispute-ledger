// Deterministic demo data for Dispute Ledger
// All names, issuers, customers, and IDs are fictional.

export type DisputeReason =
  | 'product_not_received'
  | 'fraudulent'
  | 'subscription_canceled'
  | 'duplicate'
  | 'product_unacceptable';

export type DisputeStatus = 'needs_response' | 'under_review' | 'resolved' | 'closed';
export type DisputeOutcome = 'WON' | 'LOST';
export type DisputeNetwork = 'Visa' | 'Mastercard' | 'Amex' | 'Discover';

export interface Evidence {
  type: string;
  label: string;
  available: boolean;
}

export interface DisputeTimeline {
  date: string;
  event: string;
}

export interface ResolvedDispute {
  id: string;
  reason: DisputeReason;
  issuer: string;
  network: DisputeNetwork;
  amount: number;
  currency: string;
  caseFacts: string;
  evidenceUsed: string[];
  strategy: string;
  outcome: DisputeOutcome;
  recoveredAmount: number;
  resolvedDate: string;
  lesson: string;
  customerId: string;
  productDescription: string;
}

export interface OpenDispute {
  id: string;
  status: DisputeStatus;
  reason: DisputeReason;
  amount: number;
  currency: string;
  network: DisputeNetwork;
  issuer: string;
  orderId: string;
  productDescription: string;
  transactionDate: string;
  carrierDeliveryDate?: string;
  disputeOpenedDate: string;
  responseDueDate: string;
  customerId: string;
  merchantId: string;
  timeline: DisputeTimeline[];
}

// ─── RESOLVED HISTORICAL DISPUTES ──────────────────────────────────────────────

export const RESOLVED_DISPUTES: ResolvedDispute[] = [
  // PRODUCT NOT RECEIVED (8: 5 won / 3 lost)
  {
    id: 'DL-1107',
    reason: 'product_not_received',
    issuer: 'Northstar Bank',
    network: 'Visa',
    amount: 429,
    currency: 'USD',
    caseFacts:
      'Carrier marked delivered to billing address. Customer contacted support after delivery asking about product configuration.',
    evidenceUsed: [
      'Carrier delivery scan',
      'Billing/shipping address match',
      'Post-delivery support transcript',
    ],
    strategy:
      'Lead with possession/use evidence (post-delivery support interaction), then corroborate with delivery scan and address match.',
    outcome: 'WON',
    recoveredAmount: 429,
    resolvedDate: '2026-07-14',
    lesson:
      'Customer interaction after recorded delivery supplied strong possession/use context. Tracking plus post-delivery customer interaction was stronger than tracking alone.',
    customerId: 'CUST-4421',
    productDescription: 'BlueFin 27-inch gaming monitor',
  },
  {
    id: 'DL-1089',
    reason: 'product_not_received',
    issuer: 'Northstar Bank',
    network: 'Visa',
    amount: 319,
    currency: 'USD',
    caseFacts:
      'Only a generic tracking number screenshot and delivered status were submitted. No customer interaction or location corroboration provided.',
    evidenceUsed: ['Generic carrier tracking screenshot'],
    strategy: 'Submitted tracking number as sole evidence without corroborating documentation.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-06-22',
    lesson:
      'Tracking alone was weak in this merchant case. Issuer required additional corroboration. A single delivered screenshot was insufficient for Northstar Bank.',
    customerId: 'CUST-3318',
    productDescription: 'Wireless noise-canceling headphones',
  },
  {
    id: 'DL-1142',
    reason: 'product_not_received',
    issuer: 'Meridian Credit Union',
    network: 'Mastercard',
    amount: 567,
    currency: 'USD',
    caseFacts:
      'Geo-matched delivery record showed package delivered to billing address GPS coordinates. Customer contacted support post-delivery asking about setup.',
    evidenceUsed: [
      'GPS-matched delivery confirmation',
      'Shipping address match',
      'Post-delivery support transcript',
    ],
    strategy:
      'Combine geo-matched delivery record with post-delivery support interaction to demonstrate possession and use.',
    outcome: 'WON',
    recoveredAmount: 567,
    resolvedDate: '2026-07-28',
    lesson:
      'Delivery-location evidence plus post-delivery customer interaction formed a stronger case than tracking alone. GPS corroboration added credibility.',
    customerId: 'CUST-5503',
    productDescription: 'Precision 4K webcam bundle',
  },
  {
    id: 'DL-1165',
    reason: 'product_not_received',
    issuer: 'Pinnacle Federal',
    network: 'Visa',
    amount: 249,
    currency: 'USD',
    caseFacts:
      'Generic delivery screenshot submitted. Billing address had a unit number discrepancy versus shipping label. No customer communication after alleged delivery.',
    evidenceUsed: ['Generic carrier screenshot'],
    strategy: 'Relied on tracking screenshot alone; did not address address discrepancy.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-08-04',
    lesson:
      'Unresolved address ambiguity weakened the response. Any address inconsistency must be explained or the case is likely to fail.',
    customerId: 'CUST-6712',
    productDescription: 'Portable SSD 1TB',
  },
  {
    id: 'DL-1201',
    reason: 'product_not_received',
    issuer: 'Clearwater Savings',
    network: 'Mastercard',
    amount: 389,
    currency: 'USD',
    caseFacts:
      'Carrier confirmed delivery with photo at front door. Customer had emailed support two days after delivery about product compatibility question.',
    evidenceUsed: [
      'Carrier delivery photo',
      'Delivery confirmation scan',
      'Post-delivery customer email',
    ],
    strategy:
      'Submit delivery photo as primary evidence, supplement with post-delivery customer interaction.',
    outcome: 'WON',
    recoveredAmount: 389,
    resolvedDate: '2026-08-18',
    lesson:
      'Delivery photograph is the strongest single piece of evidence; combined with post-delivery customer contact, it is very difficult to rebut.',
    customerId: 'CUST-7834',
    productDescription: 'Smart home hub bundle',
  },
  {
    id: 'DL-1219',
    reason: 'product_not_received',
    issuer: 'Horizon National Bank',
    network: 'Visa',
    amount: 712,
    currency: 'USD',
    caseFacts:
      'Large-value item. Carrier scan confirmed delivery. Address matched perfectly. Customer had opened a return request three days after delivery, which indicated possession.',
    evidenceUsed: [
      'Carrier delivery scan',
      'Address match',
      'Customer return request timestamp',
    ],
    strategy:
      'The return request timestamp after delivery implicitly proves possession. Present it as behavioral evidence of receipt.',
    outcome: 'WON',
    recoveredAmount: 712,
    resolvedDate: '2026-08-29',
    lesson:
      'Any post-delivery customer action (return request, support contact, review) can serve as indirect possession evidence.',
    customerId: 'CUST-8901',
    productDescription: 'ProAudio studio interface',
  },
  {
    id: 'DL-1244',
    reason: 'product_not_received',
    issuer: 'Northstar Bank',
    network: 'Amex',
    amount: 195,
    currency: 'USD',
    caseFacts:
      'Standard delivery confirmation. No post-delivery customer contact. Item was a lower value accessory. Tracking showed delivered but no additional corroboration.',
    evidenceUsed: ['Carrier tracking confirmation'],
    strategy: 'Standard tracking submission only.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-09-01',
    lesson:
      'Even for lower-value items, tracking alone is insufficient for this issuer. Post-delivery interaction evidence is needed across all order values.',
    customerId: 'CUST-9043',
    productDescription: 'USB-C docking station accessory',
  },
  {
    id: 'DL-1267',
    reason: 'product_not_received',
    issuer: 'Summit Valley Credit',
    network: 'Mastercard',
    amount: 534,
    currency: 'USD',
    caseFacts:
      'Carrier confirmed delivery. Customer had called support the day after delivery to inquire about warranty registration process, demonstrating they had the product.',
    evidenceUsed: [
      'Carrier delivery scan',
      'Address match',
      'Post-delivery phone support transcript (warranty inquiry)',
    ],
    strategy:
      'Lead with post-delivery customer behavior (warranty inquiry call) as proof of possession, then delivery documentation.',
    outcome: 'WON',
    recoveredAmount: 534,
    resolvedDate: '2026-09-10',
    lesson:
      'Warranty inquiry calls after delivery are particularly strong possession indicators because customers would not ask about warranty for products they do not have.',
    customerId: 'CUST-1122',
    productDescription: 'NexGen 32-inch curved monitor',
  },

  // FRAUDULENT / UNRECOGNIZED (7: 3 won / 4 lost)
  {
    id: 'DL-0892',
    reason: 'fraudulent',
    issuer: 'Riverside Trust',
    network: 'Visa',
    amount: 1250,
    currency: 'USD',
    caseFacts:
      'Transaction had full AVS and CVV match. IP matched customer prior purchase history. Device fingerprint matched previous successful orders.',
    evidenceUsed: ['AVS match', 'CVV match', 'IP history match', 'Device fingerprint', 'Prior purchase history'],
    strategy: 'Present comprehensive authentication evidence showing consistent customer behavior pattern.',
    outcome: 'WON',
    recoveredAmount: 1250,
    resolvedDate: '2026-06-15',
    lesson:
      'Multi-factor authentication match (AVS + CVV + device + IP + purchase history) is a strong fraud defense when all five factors align.',
    customerId: 'CUST-2345',
    productDescription: 'Laptop bundle premium',
  },
  {
    id: 'DL-0901',
    reason: 'fraudulent',
    issuer: 'Eastfield Commerce Bank',
    network: 'Mastercard',
    amount: 847,
    currency: 'USD',
    caseFacts:
      'Transaction had AVS partial match only. No 3DS authentication used. IP was different from any prior customer session. No prior purchase history with this device.',
    evidenceUsed: ['Partial AVS match'],
    strategy: 'Submitted partial AVS match as sole evidence.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-07-02',
    lesson:
      'Partial AVS match alone is insufficient when other authentication factors are absent or inconsistent. 3DS authentication is a significant defensive layer.',
    customerId: 'CUST-3456',
    productDescription: 'Tablet and stylus bundle',
  },
  {
    id: 'DL-0934',
    reason: 'fraudulent',
    issuer: 'Northstar Bank',
    network: 'Visa',
    amount: 2100,
    currency: 'USD',
    caseFacts:
      'High-value transaction. Full 3DS authentication completed. AVS and CVV matched. Cardholder had transacted with merchant three prior times using same device.',
    evidenceUsed: ['3DS authentication record', 'AVS match', 'CVV match', 'Prior transaction history'],
    strategy: '3DS completion is a near-conclusive fraud defense; lead with it plus prior relationship evidence.',
    outcome: 'WON',
    recoveredAmount: 2100,
    resolvedDate: '2026-07-19',
    lesson:
      '3DS authentication completion shifts liability and is the most defensible position for fraud chargebacks. Always surface 3DS records first.',
    customerId: 'CUST-4567',
    productDescription: 'Professional video editing system',
  },
  {
    id: 'DL-0956',
    reason: 'fraudulent',
    issuer: 'Pacific Gateway Bank',
    network: 'Amex',
    amount: 650,
    currency: 'USD',
    caseFacts:
      'No 3DS. AVS did not match. IP was a known VPN exit node. New account, no purchase history.',
    evidenceUsed: ['Order confirmation'],
    strategy: 'Submitted order receipt only.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-08-07',
    lesson:
      'When multiple risk signals are negative (no 3DS, AVS fail, VPN IP, new customer), the case is extremely difficult to defend. Fraud screening at checkout is critical.',
    customerId: 'CUST-5678',
    productDescription: 'Noise-canceling earbuds premium',
  },
  {
    id: 'DL-0978',
    reason: 'fraudulent',
    issuer: 'Meridian Credit Union',
    network: 'Mastercard',
    amount: 445,
    currency: 'USD',
    caseFacts:
      'Transaction had AVS full match but no 3DS. Device was new but customer had one prior order. IP matched a residential address in customer zip code.',
    evidenceUsed: ['AVS full match', 'IP geolocation match', 'Prior order reference'],
    strategy: 'Present AVS match and geographic IP consistency with prior customer behavior.',
    outcome: 'WON',
    recoveredAmount: 445,
    resolvedDate: '2026-08-21',
    lesson:
      'Full AVS match combined with IP geolocation consistency and prior purchase history can succeed even without 3DS for moderate-value transactions.',
    customerId: 'CUST-6789',
    productDescription: 'Smart speaker with display',
  },
  {
    id: 'DL-1012',
    reason: 'fraudulent',
    issuer: 'Summit Valley Credit',
    network: 'Visa',
    amount: 880,
    currency: 'USD',
    caseFacts:
      'Partial AVS, no CVV match recorded (card present override). Order shipped to billing address. No 3DS used. Transaction flagged for review but cleared.',
    evidenceUsed: ['Shipping to billing address', 'Internal fraud score'],
    strategy: 'Argued internal fraud score was low; shipped to billing address.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-09-05',
    lesson:
      'Internal fraud scores and billing-address shipping are weak arguments without authentication data. CVV mismatch undermines any other evidence.',
    customerId: 'CUST-7890',
    productDescription: 'Action camera kit',
  },
  {
    id: 'DL-1043',
    reason: 'fraudulent',
    issuer: 'Horizon National Bank',
    network: 'Discover',
    amount: 1650,
    currency: 'USD',
    caseFacts:
      'No 3DS authentication. AVS mismatch. Customer email domain was newly registered. High-value electronics shipped to freight forwarder.',
    evidenceUsed: ['Order timestamp', 'Email confirmation'],
    strategy: 'Submitted order and email confirmation only.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-09-15',
    lesson:
      'Freight forwarder shipping destination combined with other risk signals is nearly impossible to defend without strong authentication.',
    customerId: 'CUST-8123',
    productDescription: 'High-end gaming PC',
  },

  // SUBSCRIPTION CANCELED (6: 4 won / 2 lost)
  {
    id: 'DL-0745',
    reason: 'subscription_canceled',
    issuer: 'Clearwater Savings',
    network: 'Visa',
    amount: 199,
    currency: 'USD',
    caseFacts:
      'Customer accepted subscription terms at signup. Renewal notice sent 14 days prior. Customer continued to use service for 8 days after renewal.',
    evidenceUsed: ['Accepted subscription terms', 'Renewal notice sent log', 'Usage logs after renewal'],
    strategy:
      'Show accepted terms, advance notice, and post-renewal usage to demonstrate customer received value.',
    outcome: 'WON',
    recoveredAmount: 199,
    resolvedDate: '2026-05-30',
    lesson:
      'Usage after renewal is very strong evidence. If the customer used the service after being charged, the renewal dispute is difficult to sustain.',
    customerId: 'CUST-1234',
    productDescription: 'Annual software license subscription',
  },
  {
    id: 'DL-0761',
    reason: 'subscription_canceled',
    issuer: 'Eastfield Commerce Bank',
    network: 'Mastercard',
    amount: 149,
    currency: 'USD',
    caseFacts:
      'Customer claimed they canceled but no cancellation record exists in system. Renewal notice sent. No usage after renewal date.',
    evidenceUsed: ['Accepted subscription terms', 'Renewal notice', 'Absence of cancellation record'],
    strategy: 'Show no cancellation was processed; subscription terms permit renewal.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-06-14',
    lesson:
      'Absence of cancellation record is a weak argument if usage also stopped. Without post-renewal usage, the issuer may assume customer tried to cancel.',
    customerId: 'CUST-2345',
    productDescription: 'Monthly cloud storage plan',
  },
  {
    id: 'DL-0789',
    reason: 'subscription_canceled',
    issuer: 'Northstar Bank',
    network: 'Visa',
    amount: 299,
    currency: 'USD',
    caseFacts:
      'Customer accepted trial terms explicitly acknowledging auto-renewal. Renewal notice sent 30 days prior. Customer used product feature 3 times post-renewal.',
    evidenceUsed: [
      'Explicit auto-renewal acceptance',
      '30-day renewal notice',
      'Post-renewal feature usage logs',
    ],
    strategy: 'Emphasize explicit auto-renewal consent and post-renewal usage.',
    outcome: 'WON',
    recoveredAmount: 299,
    resolvedDate: '2026-07-01',
    lesson:
      'Explicit auto-renewal acceptance (not buried in terms) plus advance notice plus post-renewal usage is the strongest triple defense for subscription chargebacks.',
    customerId: 'CUST-3456',
    productDescription: 'Annual premium analytics subscription',
  },
  {
    id: 'DL-0812',
    reason: 'subscription_canceled',
    issuer: 'Riverside Trust',
    network: 'Mastercard',
    amount: 89,
    currency: 'USD',
    caseFacts:
      'Customer had logged into account 12 times after renewal. Accepted terms. Renewal notice sent 7 days prior (short window).',
    evidenceUsed: ['Terms acceptance', 'Login activity after renewal', 'Renewal notice'],
    strategy: 'Heavy login activity after renewal demonstrates continued use.',
    outcome: 'WON',
    recoveredAmount: 89,
    resolvedDate: '2026-07-18',
    lesson:
      'Login frequency after renewal is strong behavioral evidence even with a shorter renewal notice window.',
    customerId: 'CUST-4567',
    productDescription: 'Monthly project management subscription',
  },
  {
    id: 'DL-0834',
    reason: 'subscription_canceled',
    issuer: 'Pacific Gateway Bank',
    network: 'Visa',
    amount: 399,
    currency: 'USD',
    caseFacts:
      'Customer submitted screenshot of email they sent requesting cancellation before renewal. System shows no cancellation was processed. No usage after renewal.',
    evidenceUsed: ['Subscription terms', 'Renewal notice'],
    strategy: 'Relied on terms and renewal notice; did not address customer cancellation email.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-08-11',
    lesson:
      'When customer has documented cancellation attempt, the response must directly address the cancellation request failure. Ignoring it is fatal to the case.',
    customerId: 'CUST-5678',
    productDescription: 'Enterprise integration platform subscription',
  },
  {
    id: 'DL-0856',
    reason: 'subscription_canceled',
    issuer: 'Meridian Credit Union',
    network: 'Discover',
    amount: 129,
    currency: 'USD',
    caseFacts:
      'Renewal notice sent 14 days prior. Customer had accessed account 5 times after renewal. Terms clearly stated cancellation policy. Refund policy period had expired.',
    evidenceUsed: ['Renewal notice', 'Post-renewal access logs', 'Terms with cancellation policy', 'Refund window documentation'],
    strategy: 'Holistic defense: notice, usage, clear terms, and expired refund window.',
    outcome: 'WON',
    recoveredAmount: 129,
    resolvedDate: '2026-08-25',
    lesson:
      'Including the refund policy expiration in the response closes the refund expectation argument. All four elements together create a comprehensive defense.',
    customerId: 'CUST-6789',
    productDescription: 'Monthly creative suite subscription',
  },

  // DUPLICATE (5: 4 won / 1 lost)
  {
    id: 'DL-0634',
    reason: 'duplicate',
    issuer: 'Summit Valley Credit',
    network: 'Visa',
    amount: 599,
    currency: 'USD',
    caseFacts:
      'Customer claimed double charge. System shows two distinct orders with separate order IDs, different fulfillment records, and separate shipping labels.',
    evidenceUsed: ['Both transaction IDs', 'Separate order IDs', 'Two distinct fulfillment records', 'Two shipping labels'],
    strategy: 'Prove both transactions represent separate orders and deliveries.',
    outcome: 'WON',
    recoveredAmount: 599,
    resolvedDate: '2026-05-15',
    lesson:
      'Clear documentation showing two separate orders and fulfillments is conclusive for duplicate disputes.',
    customerId: 'CUST-7890',
    productDescription: 'Two separate monitor stands ordered separately',
  },
  {
    id: 'DL-0651',
    reason: 'duplicate',
    issuer: 'Northstar Bank',
    network: 'Mastercard',
    amount: 189,
    currency: 'USD',
    caseFacts:
      'Two identical transactions appeared. Investigation confirmed a technical processing error created a true duplicate. Refund was issued for one charge.',
    evidenceUsed: ['Refund confirmation record', 'Duplicate transaction acknowledgment'],
    strategy: 'Acknowledge the true duplicate, show refund was issued.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-06-03',
    lesson:
      'True duplicates from processing errors must be refunded promptly. Attempting to defend a genuine duplicate wastes time and goodwill.',
    customerId: 'CUST-8901',
    productDescription: 'Keyboard and mouse set',
  },
  {
    id: 'DL-0673',
    reason: 'duplicate',
    issuer: 'Horizon National Bank',
    network: 'Visa',
    amount: 450,
    currency: 'USD',
    caseFacts:
      'Customer said they saw two charges. One was the original sale, the other was an authorized pre-auth hold that posted after the main settlement. Different timestamps and amounts.',
    evidenceUsed: ['Both transaction IDs', 'Transaction timestamps', 'Pre-auth vs. final settlement explanation'],
    strategy: 'Explain the pre-authorization and settlement process clearly; show different amounts.',
    outcome: 'WON',
    recoveredAmount: 450,
    resolvedDate: '2026-07-10',
    lesson:
      'Pre-authorization and final settlement charges look like duplicates to cardholders. A clear technical explanation with different amounts and timestamps resolves these efficiently.',
    customerId: 'CUST-9012',
    productDescription: 'Premium headset',
  },
  {
    id: 'DL-0698',
    reason: 'duplicate',
    issuer: 'Clearwater Savings',
    network: 'Mastercard',
    amount: 290,
    currency: 'USD',
    caseFacts:
      'Customer placed order twice within 2 minutes but claims they only intended one. Separate order confirmations sent to customer email for both. Both were fulfilled.',
    evidenceUsed: ['Both transaction IDs', 'Order confirmation emails with timestamps', 'Two separate fulfillment records'],
    strategy: 'Show two separate intentional orders, each confirmed via email.',
    outcome: 'WON',
    recoveredAmount: 290,
    resolvedDate: '2026-08-01',
    lesson:
      'Two order confirmations sent to the customer before they disputed demonstrate the customer was notified and had opportunity to cancel the second order.',
    customerId: 'CUST-1023',
    productDescription: 'Cable management kit (ordered twice)',
  },
  {
    id: 'DL-0721',
    reason: 'duplicate',
    issuer: 'Eastfield Commerce Bank',
    network: 'Amex',
    amount: 790,
    currency: 'USD',
    caseFacts:
      'Customer claimed duplicate charge. Both transactions had same amount, same merchant, same day. Investigation showed two separate orders placed on same device 90 minutes apart.',
    evidenceUsed: ['Both transaction IDs with different timestamps', 'Two order IDs', 'Device session logs'],
    strategy: 'Different timestamps and order IDs with device session confirmation prove separate intent.',
    outcome: 'WON',
    recoveredAmount: 790,
    resolvedDate: '2026-08-22',
    lesson:
      'Ninety-minute gap with separate device sessions strongly indicates separate intentional orders, not a technical duplicate.',
    customerId: 'CUST-2034',
    productDescription: 'Ergonomic chair and desk bundle',
  },

  // PRODUCT UNACCEPTABLE (4: 2 won / 2 lost)
  {
    id: 'DL-0512',
    reason: 'product_unacceptable',
    issuer: 'Riverside Trust',
    network: 'Visa',
    amount: 340,
    currency: 'USD',
    caseFacts:
      'Customer claimed product did not match advertised specs. Our listing clearly stated specs; customer misread. Offered replacement; customer declined.',
    evidenceUsed: ['Product listing with specs', 'Customer communication log', 'Replacement offer documentation'],
    strategy: 'Show specs match listing; document resolution attempt.',
    outcome: 'WON',
    recoveredAmount: 340,
    resolvedDate: '2026-06-28',
    lesson:
      'When specs match the listing and a replacement was offered, the issuer typically sides with the merchant. Document all resolution attempts.',
    customerId: 'CUST-3045',
    productDescription: 'Mechanical keyboard',
  },
  {
    id: 'DL-0534',
    reason: 'product_unacceptable',
    issuer: 'Pacific Gateway Bank',
    network: 'Mastercard',
    amount: 620,
    currency: 'USD',
    caseFacts:
      'Customer provided photos of damaged item upon arrival. Packaging appeared intact. Customer wanted replacement not refund. We offered refund only.',
    evidenceUsed: ['Product listing', 'Shipping confirmation'],
    strategy: 'Disputed the damage claim without addressing customer photos or their preferred resolution.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-07-22',
    lesson:
      'Customer photos of damage must be addressed directly. Offering only a refund when customer prefers a replacement can lead to chargeback escalation.',
    customerId: 'CUST-4056',
    productDescription: 'Mirrorless camera kit',
  },
  {
    id: 'DL-0557',
    reason: 'product_unacceptable',
    issuer: 'Northstar Bank',
    network: 'Visa',
    amount: 485,
    currency: 'USD',
    caseFacts:
      'Customer claimed product defective on arrival. Support transcript shows customer provided no photos. Offered diagnostics support and replacement; customer went to chargeback without responding.',
    evidenceUsed: ['Support transcript', 'Replacement offer', 'Diagnostic offer'],
    strategy: 'Show good-faith resolution attempts; customer abandoned resolution process.',
    outcome: 'WON',
    recoveredAmount: 485,
    resolvedDate: '2026-08-14',
    lesson:
      'When a customer bypasses the merchant resolution process without responding to resolution offers, the issuer often sides with the merchant if offers are documented.',
    customerId: 'CUST-5067',
    productDescription: 'Streaming capture card',
  },
  {
    id: 'DL-0578',
    reason: 'product_unacceptable',
    issuer: 'Meridian Credit Union',
    network: 'Discover',
    amount: 895,
    currency: 'USD',
    caseFacts:
      'Customer provided detailed photos and video of product not meeting advertised refresh rate. Third-party diagnostic confirmed defect. Product was returned.',
    evidenceUsed: ['Customer-provided diagnostic photos', 'Third-party diagnostic report'],
    strategy: 'Could not counter third-party diagnostic confirmation of defect.',
    outcome: 'LOST',
    recoveredAmount: 0,
    resolvedDate: '2026-09-03',
    lesson:
      'Third-party diagnostic confirmation of a defect is very difficult to counter. In-house quality controls and stricter pre-shipment inspection reduce this risk.',
    customerId: 'CUST-6078',
    productDescription: 'High-refresh-rate monitor',
  },
];

// ─── OPEN (UNRESOLVED) DISPUTES ─────────────────────────────────────────────────

export const OPEN_DISPUTES: OpenDispute[] = [
  {
    id: 'DL-2048',
    status: 'needs_response',
    reason: 'product_not_received',
    amount: 499,
    currency: 'USD',
    network: 'Visa',
    issuer: 'Northstar Bank',
    orderId: 'A-8842',
    productDescription: 'NovaView 34-inch monitor',
    transactionDate: '2026-09-02',
    carrierDeliveryDate: '2026-09-06',
    disputeOpenedDate: '2026-09-18',
    responseDueDate: '2026-09-30',
    customerId: 'CUST-9901',
    merchantId: 'MERCHANT-DEMO-001',
    timeline: [
      { date: '2026-09-02', event: 'Transaction processed — $499.00 USD' },
      { date: '2026-09-03', event: 'Order confirmed; shipped via FastShip Express' },
      { date: '2026-09-06', event: 'Carrier GPS scan: delivered to shipping address' },
      { date: '2026-09-08', event: 'Customer contacted support: "How do I enable 144 Hz on the NovaView monitor?"' },
      { date: '2026-09-18', event: 'Chargeback filed: product not received — Northstar Bank' },
      { date: '2026-09-28', event: 'Case assigned for response — DL-2048' },
    ],
  },
  {
    id: 'DL-2049',
    status: 'needs_response',
    reason: 'fraudulent',
    amount: 1125,
    currency: 'USD',
    network: 'Mastercard',
    issuer: 'Eastfield Commerce Bank',
    orderId: 'B-4421',
    productDescription: 'ProStream capture bundle',
    transactionDate: '2026-09-10',
    disputeOpenedDate: '2026-09-22',
    responseDueDate: '2026-10-02',
    customerId: 'CUST-4482',
    merchantId: 'MERCHANT-DEMO-001',
    timeline: [
      { date: '2026-09-10', event: 'Transaction processed — $1,125.00 USD' },
      { date: '2026-09-11', event: 'Order shipped; delivery confirmed 2026-09-14' },
      { date: '2026-09-22', event: 'Chargeback filed: unrecognized transaction — Eastfield Commerce Bank' },
      { date: '2026-09-28', event: 'Case assigned for response — DL-2049' },
    ],
  },
  {
    id: 'DL-2050',
    status: 'under_review',
    reason: 'subscription_canceled',
    amount: 249,
    currency: 'USD',
    network: 'Visa',
    issuer: 'Clearwater Savings',
    orderId: 'SUB-1183',
    productDescription: 'Annual CloudSync Pro subscription',
    transactionDate: '2026-09-15',
    disputeOpenedDate: '2026-09-24',
    responseDueDate: '2026-10-05',
    customerId: 'CUST-7712',
    merchantId: 'MERCHANT-DEMO-001',
    timeline: [
      { date: '2026-08-15', event: 'Renewal notice sent — 30 days prior' },
      { date: '2026-09-15', event: 'Annual subscription renewed — $249.00 USD' },
      { date: '2026-09-20', event: 'Customer accessed account (last session)' },
      { date: '2026-09-24', event: 'Chargeback filed: subscription canceled — Clearwater Savings' },
    ],
  },
  {
    id: 'DL-2051',
    status: 'needs_response',
    reason: 'duplicate',
    amount: 329,
    currency: 'USD',
    network: 'Mastercard',
    issuer: 'Summit Valley Credit',
    orderId: 'C-2291',
    productDescription: 'Mechanical keyboard',
    transactionDate: '2026-09-20',
    disputeOpenedDate: '2026-09-26',
    responseDueDate: '2026-10-08',
    customerId: 'CUST-5531',
    merchantId: 'MERCHANT-DEMO-001',
    timeline: [
      { date: '2026-09-20', event: 'First transaction — $329.00 USD (Order C-2291)' },
      { date: '2026-09-20', event: 'Second transaction — $329.00 USD (Order C-2293, placed 47 min later)' },
      { date: '2026-09-21', event: 'Both orders shipped separately' },
      { date: '2026-09-26', event: 'Chargeback filed: duplicate charge — Summit Valley Credit' },
    ],
  },
];

// ─── COMPUTED METRICS ────────────────────────────────────────────────────────────

export function computeMetrics() {
  const won = RESOLVED_DISPUTES.filter((d) => d.outcome === 'WON');
  const lost = RESOLVED_DISPUTES.filter((d) => d.outcome === 'LOST');
  const winRate = won.length / (won.length + lost.length);
  const recoveredValue = won.reduce((sum, d) => sum + d.recoveredAmount, 0);
  const amountAtRisk = OPEN_DISPUTES.reduce((sum, d) => sum + d.amount, 0);

  return {
    openCases: OPEN_DISPUTES.length,
    amountAtRisk,
    winRate,
    recoveredValue,
    resolvedCases: RESOLVED_DISPUTES.length,
    wonCases: won.length,
    lostCases: lost.length,
  };
}

export function getDisputeById(id: string): OpenDispute | undefined {
  return OPEN_DISPUTES.find((d) => d.id === id);
}
