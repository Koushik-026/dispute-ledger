import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Dispute Ledger — Merchant Dispute Memory',
  description:
    'Dispute Ledger: A merchant chargeback-response workspace powered by Hindsight memory. Every resolved case makes the next response stronger.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className="app-shell">
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="sidebar-brand">
              <h1>Dispute Ledger</h1>
              <p>Merchant dispute memory</p>
            </div>
            <nav className="sidebar-nav">
              <Link href="/" className="nav-link">
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                </svg>
                Dashboard
              </Link>
              <Link href="/disputes/DL-2048" className="nav-link">
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 12h6M9 16h6M9 8h6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Golden Demo
                <span className="badge badge-teal" style={{ marginLeft: 'auto', fontSize: '0.5625rem' }}>DL-2048</span>
              </Link>
              <div style={{ padding: '0.5rem 1.25rem', marginTop: '0.25rem' }}>
                <div className="section-title">Case Queue</div>
              </div>
              {['DL-2048', 'DL-2049', 'DL-2050', 'DL-2051'].map((id) => (
                <Link key={id} href={`/disputes/${id}`} className="nav-link">
                  <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                  {id}
                </Link>
              ))}
              <div style={{ padding: '0.5rem 1.25rem', marginTop: '0.5rem' }}>
                <div className="section-title">Memory</div>
              </div>
              <Link href="/memory" className="nav-link">
                <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Merchant Memory
              </Link>
            </nav>
            <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--navy-border)' }}>
              <div className="label-small" style={{ color: 'var(--text-muted)' }}>
                Powered by Hindsight Cloud
              </div>
            </div>
          </aside>
          {/* Main */}
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
