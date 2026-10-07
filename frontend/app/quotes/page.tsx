"use client";

import { useEffect, useState } from "react";
import { listQuotes } from "../../lib/api";
import { QuoteListItem, QuoteStatus } from "../../types";
import { AlertCircle, ChevronRight, LayoutGrid, List } from "lucide-react";
import Link from "next/link";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

function StatusBadge({ status }: { status: QuoteStatus }) {
  const classMap: Record<QuoteStatus, string> = {
    draft: "status-pill status-draft",
    submitted: "status-pill status-submitted",
    approved: "status-pill status-approved",
    rejected: "status-pill status-rejected",
  };
  return <span className={classMap[status]}>{status}</span>;
}

export default function QuotesList() {
  const [quotes, setQuotes] = useState<QuoteListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<QuoteStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    listQuotes()
      .then((data) => setQuotes(data))
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = filter === "all" ? quotes : quotes.filter((q) => q.status === filter);

  const counts = {
    all: quotes.length,
    draft: quotes.filter((q) => q.status === "draft").length,
    submitted: quotes.filter((q) => q.status === "submitted").length,
    approved: quotes.filter((q) => q.status === "approved").length,
    rejected: quotes.filter((q) => q.status === "rejected").length,
  };

  return (
    <div style={{ paddingBottom: '6rem' }}>
      
      {/* ── Page Header ── */}
      <div style={{ 
        padding: '3rem 0',
        display: 'flex', 
        alignItems: 'flex-end', 
        justifyContent: 'space-between', 
        gap: '2rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <div className="t-eyebrow" style={{ marginBottom: '1rem' }}>PIPELINE</div>
          <h1 className="t-h1" style={{ letterSpacing: '-0.02em' }}>Saved Quotes</h1>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/" className="btn btn-primary">
            + Create New Quote
          </Link>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="saas-card" style={{ borderColor: 'var(--rejected)', marginBottom: '2rem' }}>
          <h2 style={{ color: 'var(--rejected)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle /> Failed to load quotes.
          </h2>
          <p style={{ marginTop: '0.5rem', color: 'var(--ink-secondary)' }}>{error}</p>
        </div>
      )}

      {/* ── Toolbar ── */}
      {!isLoading && !error && quotes.length > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          {/* Filters */}
          <div style={{ 
            display: 'flex', 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: '999px', 
            padding: '0.375rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {(["all", "draft", "submitted", "approved", "rejected"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                style={{
                  background: filter === s ? 'var(--accent-subtle)' : 'transparent',
                  color: filter === s ? 'var(--accent-text)' : 'var(--ink-muted)',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.5rem 1.25rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  textTransform: 'capitalize',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {s}
                <span style={{ 
                  background: filter === s ? 'var(--accent)' : 'var(--surface-secondary)',
                  color: filter === s ? 'white' : 'var(--ink-secondary)',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}>
                  {counts[s]}
                </span>
              </button>
            ))}
          </div>
          
          {/* View Toggles */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={() => setViewMode("grid")}
              style={{
                background: viewMode === 'grid' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--ink)' : 'var(--ink-muted)',
                border: viewMode === 'grid' ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'grid' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <LayoutGrid size={20} />
            </button>
            <button 
              onClick={() => setViewMode("list")}
              style={{
                background: viewMode === 'list' ? 'var(--surface)' : 'transparent',
                color: viewMode === 'list' ? 'var(--ink)' : 'var(--ink-muted)',
                border: viewMode === 'list' ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: 'var(--radius-sm)',
                padding: '0.5rem',
                cursor: 'pointer',
                boxShadow: viewMode === 'list' ? 'var(--shadow-sm)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '1rem', color: 'var(--accent)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--accent-subtle)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
          <span style={{ fontWeight: 600, letterSpacing: '0.05em', color: 'var(--ink-secondary)' }}>LOADING PIPELINE...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="saas-card" style={{ textAlign: 'center', padding: '6rem 2rem' }}>
          <div style={{ width: '64px', height: '64px', background: 'var(--surface-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--ink-muted)' }}>
            <LayoutGrid size={32} />
          </div>
          <h2 className="t-h2" style={{ marginBottom: '0.5rem' }}>
            {filter === "all" ? "No quotes yet" : `No ${filter} quotes`}
          </h2>
          <p style={{ color: 'var(--ink-secondary)', marginBottom: '2rem' }}>
            {filter === "all"
              ? "Create your first quote to see it here."
              : `You don't have any quotes matching the "${filter}" status.`}
          </p>
          {filter === "all" && (
            <a href="/" className="btn btn-primary">
              Create Quote
            </a>
          )}
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filtered.map((q) => (
            <Link 
              key={q.id}
              href={`/quotes/${q.id}`} 
              className="saas-card-small"
              style={{ 
                textDecoration: 'none', 
                color: 'inherit',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--surface-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '0.05em' }}>
                  QT-{q.id.slice(0, 8).toUpperCase()}
                </div>
                <StatusBadge status={q.status} />
              </div>
              
              <h3 className="t-h3" style={{ marginBottom: '0.5rem', lineHeight: 1.2 }}>{q.customer_name}</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--ink-secondary)', marginBottom: '2rem' }}>
                <span className="t-num">{q.seats} seats</span>
                <span>•</span>
                <span>{formatDate(q.created_at)}</span>
              </div>
              
              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Final Total</div>
                  <div className="t-num" style={{ fontSize: '1.5rem', fontWeight: 800 }}>${fmt(q.total)}</div>
                </div>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
                  <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="saas-card" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quote ID</th>
                  <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer</th>
                  <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Seats</th>
                  <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                  <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                  <th style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr 
                    key={q.id}
                    onClick={() => window.location.href = `/quotes/${q.id}`}
                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'var(--surface-secondary)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ background: 'var(--surface-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '0.05em' }}>
                        QT-{q.id.slice(0, 8).toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>{q.customer_name}</td>
                    <td className="t-num" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'right', color: 'var(--ink-secondary)' }}>{q.seats}</td>
                    <td className="t-num" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 800 }}>${fmt(q.total)}</td>
                    <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                      <StatusBadge status={q.status} />
                    </td>
                    <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', fontSize: '0.875rem', color: 'var(--ink-secondary)' }}>{formatDate(q.created_at)}</td>
                    <td style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', textAlign: 'right', color: 'var(--ink-muted)' }}>
                      <ChevronRight size={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
