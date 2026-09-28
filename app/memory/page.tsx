'use client';

import { useState, useEffect } from 'react';
import { RESOLVED_DISPUTES } from '@/lib/demo-data';

interface SearchMemory {
  text: string;
  id?: string;
  score?: number;
}

interface PlaybookData {
  source: string;
  name: string;
  content: string | null;
  status: string;
  label?: string;
  error?: string;
}

function extractCaseIds(text: string): string[] {
  const m = text.match(/DL-\d{4}/g) ?? [];
  return Array.from(new Set(m));
}

export default function MemoryPage() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchMemory[] | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [playbook, setPlaybook] = useState<PlaybookData | null>(null);
  const [playbookLoading, setPlaybookLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch('/api/playbook')
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setPlaybook(data);
          setPlaybookLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setPlaybook({
            source: 'unavailable',
            name: 'Merchant Dispute Playbook',
            content: null,
            status: 'unavailable',
            error: 'Could not reach API',
          });
          setPlaybookLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const refreshPlaybook = async () => {
    setRefreshing(true);
    setRefreshMessage(null);
    try {
      const res = await fetch('/api/playbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      const data = await res.json();
      setRefreshMessage(data.message ?? 'Refresh queued');
      // Re-fetch after queueing
      const checkRes = await fetch('/api/playbook');
      const checkData = await checkRes.json();
      setPlaybook(checkData);
    } catch (err: unknown) {
      setRefreshMessage(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const runSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setSearchError(null);
    setSearchResults(null);
    try {
      const res = await fetch('/api/memory/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Search failed');
      setSearchResults(data.memories);
    } catch (err: unknown) {
      setSearchError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSearching(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Merchant Memory</div>
          <div className="label-small">Hindsight Cloud · {RESOLVED_DISPUTES.length} resolved cases seeded</div>
        </div>
        <span className="badge badge-teal">
          <svg style={{ width: 10, height: 10 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Hindsight Active
        </span>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', alignItems: 'start' }}>

          {/* Left: search + results */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Search */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Memory Search</span>
                <span className="badge badge-teal">Hindsight Recall</span>
              </div>
              <div className="card-body">
                <div className="flex gap-2 mb-2">
                  <input
                    className="input"
                    placeholder="e.g. product not received tracking evidence Northstar Bank..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runSearch()}
                  />
                  <button className="btn btn-teal" onClick={runSearch} disabled={searching || !query.trim()}>
                    {searching ? (
                      <><div className="loading-spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Searching...</>
                    ) : 'Search'}
                  </button>
                </div>
                <div className="text-xs text-muted">
                  Searches the merchant memory bank using semantic recall.
                  Try: &quot;product not received won with post-delivery contact&quot; or &quot;subscription cancel usage&quot;
                </div>
              </div>
            </div>

            {/* Search results */}
            {searchError && (
              <div className="badge badge-error" style={{ padding: '0.75rem', borderRadius: '6px', display: 'block', fontSize: '0.8125rem' }}>
                {searchError}
              </div>
            )}

            {searchResults !== null && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Recalled Memories</span>
                  <span className="badge badge-neutral">{searchResults.length} results</span>
                </div>
                <div className="card-body">
                  {searchResults.length === 0 ? (
                    <div className="text-secondary text-sm">No memories recalled for this query. Try a different search term or seed the bank.</div>
                  ) : (
                    searchResults.map((m, i) => {
                      const caseIds = extractCaseIds(m.text);
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
                          <div className="memory-text">{m.text}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* How It Learns */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">How Dispute Ledger Learns</span>
              </div>
              <div className="card-body">
                <div className="pipeline mb-4" style={{ flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
                  {[
                    { step: 'Retain', desc: 'Resolved case stored to Hindsight' },
                    { step: 'Recall', desc: 'Similar cases retrieved for new dispute' },
                    { step: 'Reflect', desc: 'Merchant-wide patterns synthesized' },
                    { step: 'Recommend', desc: 'Evidence priority & draft grounded' },
                    { step: 'Outcome', desc: 'Won/Lost recorded' },
                    { step: 'Retain', desc: 'New experience stored — loop closes' },
                  ].map((item, i, arr) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ textAlign: 'center' }}>
                        <div className="pipeline-step" style={{ marginBottom: '0.25rem' }}>{item.step}</div>
                        <div className="text-xs text-muted" style={{ maxWidth: '80px' }}>{item.desc}</div>
                      </div>
                      {i < arr.length - 1 && <span className="pipeline-arrow" style={{ fontSize: '1rem', color: 'var(--teal)' }}>→</span>}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-muted" style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', lineHeight: 1.6 }}>
                  Every resolved dispute makes the next response stronger. Hindsight Cloud provides persistent memory that survives session restarts, enabling evidence-pattern learning across months of merchant dispute history.
                </div>
              </div>
            </div>
          </div>

          {/* Right: Playbook + recent seeded cases */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Merchant Dispute Playbook */}
            <div className="card" style={{ border: '1px solid rgba(13,148,136,0.3)' }}>
              <div className="card-header" style={{ background: 'rgba(13,148,136,0.04)' }}>
                <span className="card-title">Merchant Dispute Playbook</span>
                <span className="badge badge-teal">Mental Model</span>
              </div>
              <div className="card-body">
                {playbookLoading ? (
                  <div className="loading-step">
                    <div className="loading-spinner" />
                    Loading playbook...
                  </div>
                ) : playbook?.content ? (
                  <>
                    {playbook.label && (
                      <div className="badge badge-neutral mb-2">{playbook.label}</div>
                    )}
                    {playbook.source === 'mental_model' && (
                      <div className="badge badge-teal mb-2">Mental Model · Precomputed</div>
                    )}
                    <div className="text-xs" style={{ lineHeight: 1.7, color: 'var(--navy)', maxHeight: '300px', overflowY: 'auto' }}>
                      {playbook.content}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-muted">
                    {playbook?.error ?? 'Playbook not yet generated. Click Refresh to build it.'}
                  </div>
                )}

                {refreshMessage && (
                  <div className="badge badge-neutral mt-2" style={{ display: 'block', fontSize: '0.6875rem' }}>{refreshMessage}</div>
                )}

                <button className="btn btn-outline btn-sm mt-3 w-full" style={{ justifyContent: 'center' }} onClick={refreshPlaybook} disabled={refreshing}>
                  {refreshing ? (
                    <><div className="loading-spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Refreshing...</>
                  ) : '↻ Refresh Playbook'}
                </button>
              </div>
            </div>

            {/* Resolved case list */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Seeded Resolved Cases</span>
                <span className="badge badge-neutral">{RESOLVED_DISPUTES.length} cases</span>
              </div>
              <div className="card-body" style={{ maxHeight: '350px', overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
                {RESOLVED_DISPUTES.slice(0, 15).map((d) => (
                  <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span className="mono text-xs font-semibold" style={{ width: '4.5rem', flexShrink: 0 }}>{d.id}</span>
                    <span className={`badge ${d.outcome === 'WON' ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.5625rem', flexShrink: 0 }}>
                      {d.outcome}
                    </span>
                    <span className="text-xs text-muted" style={{ flexShrink: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {d.lesson.substring(0, 55)}...
                    </span>
                  </div>
                ))}
                <div className="text-xs text-muted mt-2">Showing 15 of {RESOLVED_DISPUTES.length} — all seeded to Hindsight</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
