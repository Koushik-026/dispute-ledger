'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { computeMetrics, OPEN_DISPUTES } from '@/lib/demo-data';

interface HealthData {
  hindsight?: { ok: boolean; error?: string };
  groq?: { ok: boolean };
}

const metrics = computeMetrics();

function formatCurrency(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function formatPercent(n: number) {
  return (n * 100).toFixed(0) + '%';
}

function reasonLabel(r: string) {
  const map: Record<string, string> = {
    product_not_received: 'Product Not Received',
    fraudulent: 'Fraudulent',
    subscription_canceled: 'Subscription Canceled',
    duplicate: 'Duplicate',
    product_unacceptable: 'Product Unacceptable',
  };
  return map[r] ?? r;
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    needs_response: { label: 'Needs Response', cls: 'badge-error' },
    under_review: { label: 'Under Review', cls: 'badge-warning' },
    resolved: { label: 'Resolved', cls: 'badge-success' },
  };
  const m = map[status] ?? { label: status, cls: 'badge-neutral' };
  return <span className={`badge ${m.cls}`}>{m.label}</span>;
}

export default function Dashboard() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [playbookStatus, setPlaybookStatus] = useState<string>('Active');

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((d) => setHealth(d))
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));

    fetch('/api/playbook')
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (d?.source === 'mental_model' || d?.status === 'ready' || d?.status === 'live' || d?.status === 'completed' || d?.content) {
          setPlaybookStatus('Active');
        } else if (d?.status === 'queued' || d?.status === 'in_progress') {
          setPlaybookStatus('Generating');
        } else if (d?.status === 'unavailable') {
          setPlaybookStatus('Pending');
        } else {
          setPlaybookStatus('Active');
        }
      })
      .catch(() => setPlaybookStatus('Active'));
  }, []);

  const hindsightConnected = health?.hindsight?.ok === true;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="label-small" style={{ marginTop: '0.125rem' }}>
            Demo dataset · All data synthetic
          </div>
        </div>
        <div className="flex items-center gap-3">
          {healthLoading ? (
            <span className="badge badge-neutral">
              <div className="loading-spinner" style={{ width: 10, height: 10 }} />
              Checking Hindsight...
            </span>
          ) : hindsightConnected ? (
            <span className="badge badge-success">
              <div className="status-dot status-dot-green" />
              Hindsight Connected
            </span>
          ) : (
            <span className="badge badge-error">
              <div className="status-dot status-dot-red" />
              Hindsight unavailable
            </span>
          )}
        </div>
      </div>

      <div className="page-body">
        {/* KPI Row */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <div className="kpi-label">Open Cases</div>
            <div className="kpi-value">{metrics.openCases}</div>
            <span className="kpi-badge">Demo dataset</span>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Amount at Risk</div>
            <div className="kpi-value" style={{ color: 'var(--red)' }}>
              {formatCurrency(metrics.amountAtRisk)}
            </div>
            <span className="kpi-badge">Demo dataset</span>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Historical Win Rate</div>
            <div className="kpi-value" style={{ color: 'var(--green)' }}>
              {formatPercent(metrics.winRate)}
            </div>
            <div className="label-small">
              {metrics.wonCases}W / {metrics.lostCases}L · <span className="kpi-badge">Demo dataset</span>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Recovered Value</div>
            <div className="kpi-value" style={{ color: 'var(--teal)' }}>
              {formatCurrency(metrics.recoveredValue)}
            </div>
            <span className="kpi-badge">Demo dataset</span>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Dispute Queue */}
          <div className="card" style={{ gridColumn: '1 / 2' }}>
            <div className="card-header">
              <span className="card-title">Open Dispute Queue</span>
              <span className="badge badge-neutral">{OPEN_DISPUTES.length} cases</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Case ID</th>
                  <th>Reason</th>
                  <th>Issuer</th>
                  <th>Amount</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {OPEN_DISPUTES.map((d) => (
                  <tr key={d.id} className={d.id === 'DL-2048' ? 'highlighted' : ''}>
                    <td>
                      <span className="mono font-semibold">{d.id}</span>
                      {d.id === 'DL-2048' && (
                        <span className="badge badge-teal" style={{ marginLeft: '0.5rem', fontSize: '0.5625rem' }}>
                          DEMO
                        </span>
                      )}
                    </td>
                    <td className="text-secondary">{reasonLabel(d.reason)}</td>
                    <td className="text-secondary">{d.issuer}</td>
                    <td className="font-semibold">{formatCurrency(d.amount)}</td>
                    <td>
                      <span style={{ color: d.responseDueDate <= '2026-09-30' ? 'var(--amber)' : undefined }}>
                        {d.responseDueDate}
                      </span>
                    </td>
                    <td>{statusBadge(d.status)}</td>
                    <td>
                      <Link href={`/disputes/${d.id}`} className="btn btn-outline btn-sm">
                        {d.id === 'DL-2048' ? 'Start Demo →' : 'Open'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Memory sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Merchant Memory card */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Merchant Memory</span>
                <span className="badge badge-teal">Hindsight</span>
              </div>
              <div className="card-body">
                <div className="flex justify-between mb-2">
                  <span className="text-secondary text-sm">Resolved cases</span>
                  <span className="font-semibold">{metrics.resolvedCases}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-secondary text-sm">Playbook status</span>
                  <span className={`badge ${playbookStatus === 'Active' ? 'badge-teal' : playbookStatus === 'Generating' ? 'badge-warning' : 'badge-neutral'}`}>
                    {playbookStatus}
                  </span>
                </div>
                <div className="flex justify-between mb-4">
                  <span className="text-secondary text-sm">Latest learning event</span>
                  <span className="text-sm text-muted">On outcome record</span>
                </div>
                <Link href="/memory" className="btn btn-outline btn-sm w-full" style={{ justifyContent: 'center' }}>
                  View Merchant Memory →
                </Link>
              </div>
            </div>

            {/* How Hindsight Works */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">How Hindsight Works</span>
              </div>
              <div className="card-body">
                <div className="pipeline" style={{ flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.75rem' }}>
                  {['Retain', 'Recall', 'Reflect', 'Recommend', 'Outcome', 'Retain'].map((step, i, arr) => (
                    <>
                      <span key={step + i} className="pipeline-step">{step}</span>
                      {i < arr.length - 1 && <span key={`a${i}`} className="pipeline-arrow">→</span>}
                    </>
                  ))}
                </div>
                <div className="text-xs text-muted" style={{ lineHeight: 1.6 }}>
                  <strong>Retain:</strong> Resolved cases are stored as natural-language memories in Hindsight Cloud.
                  <br /><strong>Recall:</strong> For a new dispute, semantically similar resolved cases are retrieved.
                  <br /><strong>Reflect:</strong> Hindsight synthesizes merchant-wide patterns and caveats.
                  <br /><strong>Recommend:</strong> Evidence priority and draft are grounded in history.
                  <br /><strong>Outcome:</strong> Won/Lost result retains a new experience — closing the loop.
                </div>
              </div>
            </div>

            {/* Demo CTA */}
            <div className="card" style={{ border: '2px solid var(--teal)', background: 'rgba(13,148,136,0.03)' }}>
              <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                  <svg style={{ width: '1.25rem', height: '1.25rem', color: 'var(--teal)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  <span className="font-bold" style={{ color: 'var(--navy)' }}>Golden Demo — DL-2048</span>
                </div>
                <p className="text-xs text-secondary mb-3" style={{ lineHeight: 1.5 }}>
                  NovaView 34-inch monitor · $499 · Northstar Bank · Due 2026-09-30.
                  Compare Memory OFF vs Memory ON to see Hindsight in action.
                </p>
                <Link href="/disputes/DL-2048" className="btn btn-teal w-full" style={{ justifyContent: 'center' }}>
                  Start Golden Demo →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="disclaimer">
          ⚠ Demo decision support using synthetic data. All dispute data is fictional. No processor action is taken. Review before any real submission.
        </div>
      </div>
    </>
  );
}
