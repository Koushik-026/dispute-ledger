'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { getDisputeById } from '@/lib/demo-data';
import { getEvidenceChecklist } from '@/lib/evidence-rules';
import type { MemoryOnResult } from '@/lib/schemas';

interface RecalledMemory {
  text: string;
  id?: string;
  score?: number;
}

interface BaselineResponse {
  mode: string;
  label: string;
  response: string;
  checklist: ReturnType<typeof getEvidenceChecklist>;
}

interface MemoryResponse {
  mode: string;
  label: string;
  checklist: ReturnType<typeof getEvidenceChecklist>;
  recalledMemories: RecalledMemory[];
  recalledCaseIds: string[];
  reflectionText: string;
  analysis: MemoryOnResult | null;
  groqError?: string;
  hindsightError?: string;
  memoryCount: number;
}

interface OutcomeResponse {
  success: boolean;
  caseId: string;
  outcome: string;
  message: string;
  verificationStatus: string;
}

function extractCaseIdsFromText(text: string): string[] {
  const m = text.match(/DL-\d{4}/g) ?? [];
  return Array.from(new Set(m));
}

function reasonLabel(r: string) {
  const map: Record<string, string> = {
    product_not_received: 'Product Not Received',
    fraudulent: 'Fraudulent / Unrecognized',
    subscription_canceled: 'Subscription Canceled',
    duplicate: 'Duplicate',
    product_unacceptable: 'Product Unacceptable',
  };
  return map[r] ?? r;
}

export default function DisputeWorkspace({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const dispute = getDisputeById(id);
  const checklist = dispute ? getEvidenceChecklist(id, dispute.reason) : null;

  const [activeTab, setActiveTab] = useState<'off' | 'on'>('off');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [baselineResult, setBaselineResult] = useState<BaselineResponse | null>(null);
  const [memoryResult, setMemoryResult] = useState<MemoryResponse | null>(null);
  const [outcomeState, setOutcomeState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [outcomeResult, setOutcomeResult] = useState<OutcomeResponse | null>(null);
  const [outcomeSelected, setOutcomeSelected] = useState<'won' | 'lost' | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!dispute || !checklist) {
    return (
      <div className="page-body">
        <div className="card">
          <div className="card-body">
            <h2 className="page-title">Case Not Found</h2>
            <p className="text-secondary">No dispute found for ID: {id}</p>
            <Link href="/" className="btn btn-outline mt-4">← Back to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  const runBaseline = async () => {
    setLoading(true);
    setError(null);
    setLoadingStep('Analyzing current case...');
    try {
      const res = await fetch('/api/analyze/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Baseline analysis failed');
      setBaselineResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const runMemory = async () => {
    setLoading(true);
    setError(null);
    setMemoryResult(null);

    const steps = [
      'Recalling merchant history...',
      'Reflecting across resolved cases...',
      'Building grounded strategy...',
    ];
    let stepIdx = 0;
    setLoadingStep(steps[0]);
    const stepTimer = setInterval(() => {
      stepIdx = Math.min(stepIdx + 1, steps.length - 1);
      setLoadingStep(steps[stepIdx]);
    }, 3000);

    try {
      const res = await fetch('/api/analyze/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: id }),
      });
      const data = await res.json();
      clearInterval(stepTimer);
      if (!res.ok) throw new Error(data.error ?? data.hindsightError ?? 'Memory analysis failed');
      setMemoryResult(data);
    } catch (err: unknown) {
      clearInterval(stepTimer);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const runAnalysis = () => {
    if (activeTab === 'off') runBaseline();
    else runMemory();
  };

  const recordOutcome = async (outcome: 'won' | 'lost') => {
    if (outcomeState === 'loading') return;
    setOutcomeSelected(outcome);
    setOutcomeState('loading');
    setError(null);
    try {
      const res = await fetch('/api/outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId: id, outcome }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to record outcome');
      setOutcomeResult(data);
      setOutcomeState('done');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Outcome record failed');
      setOutcomeState('idle');
    }
  };

  const memoryAnalysis = memoryResult?.analysis;

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted text-sm">← Cases</Link>
          <span className="text-muted">/</span>
          <span className="mono font-semibold">{id}</span>
          {id === 'DL-2048' && <span className="badge badge-teal">Golden Demo</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-error">
            <div className="status-dot status-dot-red" />
            Due: {dispute.responseDueDate}
          </span>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '1rem', alignItems: 'start' }}>

          {/* ── LEFT COLUMN: Case Facts ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Case facts */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Case Facts</span>
                <span className="badge badge-neutral">{reasonLabel(dispute.reason)}</span>
              </div>
              <div className="card-body" style={{ fontSize: '0.8125rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
                  {[
                    ['Case ID', id],
                    ['Amount', `$${dispute.amount} ${dispute.currency}`],
                    ['Network', dispute.network],
                    ['Issuer', dispute.issuer],
                    ['Order ID', dispute.orderId],
                    ['Product', dispute.productDescription],
                    ['Tx Date', dispute.transactionDate],
                    ...(dispute.carrierDeliveryDate ? [['Delivered', dispute.carrierDeliveryDate]] : []),
                    ['Disputed', dispute.disputeOpenedDate],
                    ['Due', dispute.responseDueDate],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs text-muted">{k}</div>
                      <div className="font-semibold" style={{ color: 'var(--navy)', fontSize: '0.8125rem' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Evidence checklist */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Evidence Checklist</span>
                <span className="badge badge-teal">{checklist.completenessLabel}</span>
              </div>
              <div className="card-body">
                {checklist.items.map((item) => (
                  <div key={item.id} className="evidence-item">
                    {item.available ? (
                      <svg className="evidence-check evidence-available" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    ) : (
                      <svg className="evidence-check evidence-missing" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v4M12 16h.01" />
                      </svg>
                    )}
                    <div>
                      <div style={{ color: item.available ? 'var(--navy)' : 'var(--text-muted)', fontWeight: item.available ? 500 : 400 }}>
                        {item.label}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-muted">{item.notes}</div>
                      )}
                      {item.missing && (
                        <div className="text-xs" style={{ color: 'var(--amber)' }}>Missing</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Case Timeline</span>
              </div>
              <div className="card-body">
                <div className="timeline">
                  {dispute.timeline.map((t, i) => (
                    <div
                      key={i}
                      className={`timeline-item ${t.event.toLowerCase().includes('support') || t.event.toLowerCase().includes('144 hz') ? 'highlighted' : ''}`}
                    >
                      <div className="timeline-date">{t.date}</div>
                      <div className="text-sm" style={{ color: 'var(--navy)' }}>{t.event}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Analysis ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Analysis panel */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Analysis</span>
                <div className="flex items-center gap-2">
                  {activeTab === 'on' && (
                    <span className="badge badge-teal">
                      <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Hindsight Active
                    </span>
                  )}
                </div>
              </div>
              <div className="card-body" style={{ paddingBottom: 0 }}>
                <div className="tab-bar">
                  <button className={`tab-btn ${activeTab === 'off' ? 'active' : ''}`} onClick={() => setActiveTab('off')}>
                    Memory OFF
                  </button>
                  <button className={`tab-btn ${activeTab === 'on' ? 'active' : ''}`} onClick={() => setActiveTab('on')}>
                    ✦ Memory ON — Hindsight
                  </button>
                </div>
              </div>

              <div className="card-body">
                {activeTab === 'off' && (
                  <div>
                    <p className="text-xs text-muted mb-3" style={{ lineHeight: 1.6 }}>
                      <strong>Stateless baseline</strong> — Groq analyzes only the current case. No historical merchant data is provided.
                    </p>
                    {!baselineResult && !loading && (
                      <button className="btn btn-outline" onClick={runBaseline}>
                        Run Baseline Analysis
                      </button>
                    )}
                  </div>
                )}

                {activeTab === 'on' && (
                  <div>
                    <p className="text-xs text-muted mb-3" style={{ lineHeight: 1.6 }}>
                      <strong>Memory ON</strong> — Hindsight recalls similar resolved cases, reflects on merchant patterns, then Groq generates a grounded strategy.
                    </p>
                    <div className="pipeline mb-3" style={{ flexWrap: 'wrap' }}>
                      {['Recall', 'Reflect', 'Ground', 'Recommend'].map((step, i, arr) => (
                        <>
                          <span key={step} className="pipeline-step">{step}</span>
                          {i < arr.length - 1 && <span key={`a${i}`} className="pipeline-arrow">→</span>}
                        </>
                      ))}
                    </div>
                    {!memoryResult && !loading && (
                      <button className="btn btn-teal" onClick={runMemory}>
                        ✦ Analyze with Hindsight Memory
                      </button>
                    )}
                  </div>
                )}

                {/* Loading state */}
                {loading && (
                  <div style={{ padding: '1rem 0' }}>
                    <div className="loading-step">
                      <div className="loading-spinner" />
                      {loadingStep}
                    </div>
                    {activeTab === 'on' && (
                      <div className="text-xs text-muted mt-2">
                        Making real Hindsight API calls — Recall → Reflect → Groq
                      </div>
                    )}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="badge badge-error" style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', display: 'block', fontSize: '0.8125rem' }}>
                    {error}
                    <button className="btn btn-sm btn-outline" style={{ marginLeft: '0.5rem' }} onClick={runAnalysis}>Retry</button>
                  </div>
                )}

                {/* Baseline result */}
                {activeTab === 'off' && baselineResult && (
                  <div>
                    <div className="badge badge-neutral mb-3">{baselineResult.label}</div>
                    <div className="draft-box">{baselineResult.response}</div>
                    <button className="btn btn-outline btn-sm mt-2" onClick={runBaseline}>Regenerate</button>
                  </div>
                )}

                {/* Memory ON result */}
                {activeTab === 'on' && memoryResult && (
                  <div>
                    <div className="badge badge-teal mb-3">
                      {memoryResult.label} · {memoryResult.memoryCount} memories recalled
                    </div>

                    {memoryAnalysis && (
                      <>
                        {/* Summary */}
                        <div className="card mb-3" style={{ background: 'rgba(13,148,136,0.04)', border: '1px solid rgba(13,148,136,0.2)' }}>
                          <div className="card-body">
                            <div className="section-title">Strategic Summary</div>
                            <div className="text-sm">{memoryAnalysis.summary}</div>
                          </div>
                        </div>

                        {/* Recommended evidence */}
                        {memoryAnalysis.recommended_evidence.length > 0 && (
                          <div className="mb-3">
                            <div className="section-title">Recommended Evidence Priority</div>
                            {memoryAnalysis.recommended_evidence.map((e, i) => (
                              <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#f0fdf4', borderRadius: '6px', marginBottom: '0.375rem', border: '1px solid #bbf7d0' }}>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="font-semibold text-sm" style={{ color: 'var(--green)' }}>{e.type}</span>
                                    <div className="text-xs text-secondary mt-0.5">{e.why}</div>
                                  </div>
                                  {e.supported_by.length > 0 && (
                                    <div className="flex gap-1" style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
                                      {e.supported_by.map((cid) => (
                                        <span key={cid} className="badge badge-neutral mono">{cid}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Deprioritize */}
                        {memoryAnalysis.deprioritize.length > 0 && (
                          <div className="mb-3">
                            <div className="section-title">Deprioritize</div>
                            {memoryAnalysis.deprioritize.map((e, i) => (
                              <div key={i} style={{ padding: '0.5rem 0.75rem', background: '#fef9ec', borderRadius: '6px', marginBottom: '0.375rem', border: '1px solid #fde68a' }}>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="font-semibold text-sm" style={{ color: 'var(--amber)' }}>{e.type}</span>
                                    <div className="text-xs text-secondary mt-0.5">{e.why}</div>
                                  </div>
                                  {e.supported_by.length > 0 && (
                                    <div className="flex gap-1" style={{ flexShrink: 0, marginLeft: '0.5rem' }}>
                                      {e.supported_by.map((cid) => (
                                        <span key={cid} className="badge badge-neutral mono">{cid}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Caveats */}
                        {memoryAnalysis.caveats.length > 0 && (
                          <div className="mb-3">
                            <div className="section-title">Caveats</div>
                            {memoryAnalysis.caveats.map((c, i) => (
                              <div key={i} className="text-xs text-secondary" style={{ paddingLeft: '0.75rem', borderLeft: '2px solid var(--amber)', marginBottom: '0.375rem' }}>
                                {c}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Draft */}
                        <div className="mb-3">
                          <div className="section-title">Grounded Response Draft</div>
                          <div className="draft-box">{memoryAnalysis.draft}</div>
                        </div>

                        {/* Why this strategy (collapsible) */}
                        {(memoryResult.reflectionText || memoryResult.recalledCaseIds.length > 0) && (
                          <div className="mb-3">
                            <button className="collapsible-btn" onClick={() => setShowReflection(!showReflection)}>
                              {showReflection ? '▾' : '▸'} Why this strategy — Hindsight sources
                            </button>
                            {showReflection && (
                              <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                {memoryResult.recalledCaseIds.length > 0 && (
                                  <div className="mb-2">
                                    <div className="section-title">Referenced Case IDs</div>
                                    <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                      {memoryResult.recalledCaseIds.map((cid) => (
                                        <span key={cid} className="badge badge-navy mono">{cid}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="section-title">Merchant Pattern Reflection</div>
                                <div className="text-xs text-secondary" style={{ lineHeight: 1.6 }}>
                                  {memoryResult.reflectionText}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}

                    {/* Groq error but Hindsight worked */}
                    {memoryResult.groqError && !memoryAnalysis && (
                      <div>
                        <div className="badge badge-error mb-2">Groq generation failed: {memoryResult.groqError}</div>
                        <div className="section-title mt-2">Hindsight Reflection (preserved)</div>
                        <div className="draft-box">{memoryResult.reflectionText}</div>
                      </div>
                    )}

                    <button className="btn btn-outline btn-sm" onClick={runMemory}>Regenerate</button>
                  </div>
                )}
              </div>
            </div>

            {/* Memory Trace panel */}
            {activeTab === 'on' && memoryResult && memoryResult.recalledMemories.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Memory Trace — Recalled Cases</span>
                  <span className="badge badge-neutral">{memoryResult.recalledMemories.length} memories</span>
                </div>
                <div className="card-body">
                  <div className="badge badge-neutral mb-3" style={{ display: 'block' }}>
                    ⚠ Historical merchant experience — guidance only; not evidence for the current dispute.
                  </div>
                  {memoryResult.recalledMemories.map((m, i) => {
                    const caseIds = extractCaseIdsFromText(m.text);
                    const upper = m.text.toUpperCase();
                    const isWon = upper.includes('WON') || upper.includes('IN FAVOR OF THE MERCHANT') || upper.includes('RECOVERING');
                    const isLost = upper.includes('LOST') || upper.includes('INSUFFICIENT');
                    return (
                      <div key={i} className="memory-card">
                        <div className="memory-card-header">
                          {caseIds.length > 0 ? (
                            caseIds.map((cid) => (
                              <span key={cid} className="memory-case-id badge badge-navy">{cid}</span>
                            ))
                          ) : (
                            <span className="badge badge-teal">Precedent Rule</span>
                          )}
                          {isWon && !isLost && <span className="badge badge-success">WON</span>}
                          {isLost && !isWon && <span className="badge badge-error">LOST</span>}
                          {m.score !== undefined && (
                            <span className="text-xs text-muted" style={{ marginLeft: 'auto' }}>
                              score: {m.score.toFixed(3)}
                            </span>
                          )}
                        </div>
                        <div className="memory-text">{m.text.substring(0, 350)}{m.text.length > 350 ? '...' : ''}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Outcome control */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Record Outcome</span>
                <span className="badge badge-neutral">Demo outcome</span>
              </div>
              <div className="card-body">
                <p className="text-xs text-muted mb-3">
                  Recording an outcome retains a new resolved case experience to Hindsight.
                  Future cases will benefit from this learning event.
                </p>

                <div className="flex gap-2">
                  <button
                    id="record-won-btn"
                    disabled={outcomeState === 'loading'}
                    className="btn btn-success"
                    onClick={() => recordOutcome('won')}
                  >
                    {outcomeState === 'loading' && outcomeSelected === 'won' ? (
                      <>
                        <div className="loading-spinner" style={{ width: 12, height: 12 }} />
                        Recording...
                      </>
                    ) : outcomeResult && outcomeResult.outcome === 'WON' ? (
                      '✓ Won Recorded'
                    ) : (
                      '✓ Record Won'
                    )}
                  </button>
                  <button
                    id="record-lost-btn"
                    disabled={outcomeState === 'loading'}
                    className="btn btn-danger"
                    onClick={() => recordOutcome('lost')}
                  >
                    {outcomeState === 'loading' && outcomeSelected === 'lost' ? (
                      <>
                        <div className="loading-spinner" style={{ width: 12, height: 12 }} />
                        Recording...
                      </>
                    ) : outcomeResult && outcomeResult.outcome === 'LOST' ? (
                      '✗ Lost Recorded'
                    ) : (
                      '✗ Record Lost'
                    )}
                  </button>
                </div>

                {outcomeState === 'loading' && (
                  <div className="loading-step mt-3">
                    <div className="loading-spinner" />
                    Retaining {outcomeSelected?.toUpperCase()} outcome to Hindsight...
                  </div>
                )}

                {outcomeResult && (
                  <div style={{ marginTop: '0.875rem' }}>
                    <div className={`badge ${outcomeResult.outcome === 'WON' ? 'badge-success' : 'badge-error'} mb-2`}>
                      {outcomeResult.outcome} — {outcomeResult.verificationStatus === 'verified' ? '✓ Verified in Hindsight' : 'Stored — indexing in progress'}
                    </div>
                    <div className="text-xs text-muted" style={{ lineHeight: 1.5 }}>
                      {outcomeResult.message}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="disclaimer">
              Demo decision support using synthetic data. Review before any real submission. No processor action is taken.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
