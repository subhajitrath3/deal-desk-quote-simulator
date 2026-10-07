"use client";

import { useEffect, useState } from "react";
import { getQuote, updateQuoteStatus } from "../../../lib/api";
import { QuoteResponse, QuoteStatus } from "../../../types";
import { AlertCircle, CheckCircle2, ChevronLeft, ShieldCheck, XCircle } from "lucide-react";
import Link from "next/link";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

function StatusBadge({ status }: { status: QuoteStatus }) {
  const classMap: Record<QuoteStatus, string> = {
    draft: "status-pill status-draft",
    submitted: "status-pill status-submitted",
    approved: "status-pill status-approved",
    rejected: "status-pill status-rejected",
  };
  return <span className={classMap[status]}>{status}</span>;
}

export default function QuoteReview({ params }: { params: { id: string } }) {
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showStatusPanel, setShowStatusPanel] = useState(false);
  const [recentStatus, setRecentStatus] = useState<QuoteStatus | null>(null);

  useEffect(() => {
    getQuote(params.id).then(setQuote).catch((e) => setError(e.message));
  }, [params.id]);

  const handleStatusUpdate = async (newStatus: QuoteStatus) => {
    if (!quote) return;
    setIsUpdating(true);
    setActionError(null);
    try {
      const updated = await updateQuoteStatus(params.id, newStatus);
      setQuote(updated);
      setRecentStatus(newStatus);
      setShowStatusPanel(true);
      setTimeout(() => setShowStatusPanel(false), 5000); // Hide after 5 seconds
    } catch (e: any) {
      setActionError(e.message || "Status update failed.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (!quote && !error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--accent)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--accent-subtle)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontWeight: 600, letterSpacing: '0.05em', color: 'var(--ink-secondary)' }}>LOADING RECORD...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="saas-card" style={{ maxWidth: 520, margin: '4rem auto', borderColor: 'var(--rejected)' }}>
        <h2 style={{ color: 'var(--rejected)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle /> Could not load quote
        </h2>
        <p style={{ marginTop: '1rem', color: 'var(--ink-secondary)', marginBottom: '2rem' }}>{error}</p>
        <a href="/quotes" className="btn btn-secondary">← Return to Pipeline</a>
      </div>
    );
  }

  if (!quote) return null;

  /* ── workflow stages ── */
  const STAGES: { key: QuoteStatus | "approved" | "rejected"; label: string }[] = [
    { key: "draft", label: "Draft" },
    { key: "submitted", label: "Under Review" },
    { key: quote.status === "rejected" ? "rejected" : "approved", label: quote.status === "rejected" ? "Rejected" : "Approved" },
  ];

  const stageIndex = (s: string) => {
    if (s === "draft") return 0;
    if (s === "submitted") return 1;
    return 2;
  };

  const currentIndex = stageIndex(quote.status);

  return (
    <div style={{ paddingBottom: '6rem' }}>

      {/* ── Top Status Notification Panel ── */}
      {showStatusPanel && (
        <div className="status-panel-overlay">
          <div className="status-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: recentStatus === 'rejected' ? 'var(--rejected)' : (recentStatus === 'approved' ? 'var(--approved)' : 'var(--accent)') }}>
              {recentStatus === 'rejected' ? <XCircle size={24} /> : <CheckCircle2 size={24} />}
              <span style={{ fontWeight: 800, letterSpacing: '0.05em', fontSize: '1.125rem' }}>
                {recentStatus === 'submitted' ? 'DEAL SUBMITTED' : (recentStatus === 'approved' ? 'DEAL APPROVED' : 'DEAL REJECTED')}
              </span>
            </div>
            
            <div style={{ display: 'flex', gap: '2rem', color: 'var(--ink)' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)' }}>CUSTOMER</div>
                <div style={{ fontWeight: 600 }}>{quote.customer_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)' }}>QUOTE ID</div>
                <div className="t-mono" style={{ fontWeight: 600 }}>QT-{quote.id.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              {STAGES.map((stage, idx) => {
                const isComplete = idx <= currentIndex;
                return (
                  <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ 
                      width: '12px', height: '12px', borderRadius: '50%', 
                      background: isComplete ? (stage.key === 'rejected' ? 'var(--rejected)' : (stage.key === 'approved' ? 'var(--approved)' : 'var(--accent)')) : 'var(--surface-secondary)',
                      boxShadow: isComplete ? `0 0 0 2px ${stage.key === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : (stage.key === 'approved' ? 'rgba(16, 185, 129, 0.2)' : 'var(--accent-subtle)')}` : 'none'
                    }} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isComplete ? 'var(--ink)' : 'var(--ink-muted)', textTransform: 'uppercase' }}>
                      {stage.label}
                    </span>
                    {idx < STAGES.length - 1 && (
                      <div style={{ width: '2rem', height: '2px', background: isComplete ? 'var(--accent)' : 'var(--border)' }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Back breadcrumb ── */}
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/quotes" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--ink-secondary)', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }}
          onMouseOver={(e) => (e.currentTarget.style.color = 'var(--ink)')}
          onMouseOut={(e) => (e.currentTarget.style.color = 'var(--ink-secondary)')}
        >
          <ChevronLeft size={16} />
          Back to Pipeline
        </Link>
      </div>

      {/* ── Page header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '2rem',
        marginBottom: '3rem',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <span style={{ background: 'var(--surface-secondary)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '0.05em' }}>QT-{quote.id.slice(0, 8).toUpperCase()}</span>
            <StatusBadge status={quote.status} />
          </div>
          <h1 className="t-h1" style={{ marginBottom: '0.5rem' }}>{quote.customer_name}</h1>
          <p style={{ color: 'var(--ink-secondary)', fontSize: '1rem' }}>Created {formatDate(quote.created_at)}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="t-eyebrow" style={{ marginBottom: '0.5rem' }}>FINAL TOTAL</div>
          <p className="t-num" style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>${fmt(quote.total)}</p>
        </div>
      </div>

      {/* ── Main content: asymmetric grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '2.5rem', alignItems: 'flex-start' }}>

        {/* ── LEFT: Commercial Data ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* Account Details */}
          <div className="saas-card">
            <h2 className="t-h2" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent)' }} />
              Contract Details
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>Organization</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{quote.customer_name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>Licensed Seats</div>
                <div className="t-num" style={{ fontSize: '1.125rem', fontWeight: 600 }}>{quote.seats}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>Pricing Tier</div>
                <div className="status-pill status-approved" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', fontSize: '0.875rem' }}>{quote.tier} TIER</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', fontWeight: 600, marginBottom: '0.5rem' }}>Contract Term</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{quote.annual_commitment ? "Annual Commitment" : "Standard"}</div>
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="saas-card" style={{ padding: 0 }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)' }}>
               <h2 className="t-h2" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent)' }} />
                Product Mix
              </h2>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Product</th>
                    <th style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border)', fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Ext. Price</th>
                  </tr>
                </thead>
                <tbody>
                  {quote.line_items.map((item, i) => (
                    <tr key={i}>
                      <td style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', letterSpacing: '0.05em' }}>{item.sku}</div>
                      </td>
                      <td className="t-num" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', textAlign: 'right', color: 'var(--ink-secondary)' }}>{item.quantity}</td>
                      <td className="t-num" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', textAlign: 'right', color: 'var(--ink-secondary)' }}>${fmt(item.unit_price)}</td>
                      <td className="t-num" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', textAlign: 'right', fontWeight: 700 }}>${fmt(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotal & Discount breakdown */}
            <div style={{ padding: '2rem', background: 'var(--surface-secondary)', borderBottomLeftRadius: 'var(--radius-lg)', borderBottomRightRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <div style={{ width: '300px', display: 'flex', justifyContent: 'space-between', color: 'var(--ink-secondary)', fontWeight: 500 }}>
                  <span>List Subtotal</span>
                  <span className="t-num">${fmt(quote.subtotal)}</span>
                </div>
              </div>
              {quote.discount_amount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
                  <div style={{ width: '300px', display: 'flex', justifyContent: 'space-between', color: 'var(--accent)', fontWeight: 500 }}>
                    <span>Discount ({quote.discount_pct}%)</span>
                    <span className="t-num">−${fmt(quote.discount_amount)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* ── RIGHT: Sidebar (Sticky) ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem', position: 'sticky', top: '6rem' }}>

          {/* Workflow Status Timeline */}
          <div className="saas-card">
            <h3 className="t-eyebrow" style={{ marginBottom: '1.5rem' }}>WORKFLOW STATUS</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingLeft: '0.5rem' }}>
              {STAGES.map((stage, idx) => {
                const isComplete = idx < currentIndex;
                const isActive = idx === currentIndex;
                const isRejected = isActive && quote.status === "rejected";
                const isApproved = isActive && quote.status === "approved";
                
                let stepClass = "";
                if (isActive) stepClass = "is-active";
                if (isApproved) stepClass = "is-approved";
                if (isRejected) stepClass = "is-rejected";

                return (
                  <div key={stage.key} className={`timeline-step ${stepClass}`} style={{ position: 'relative', display: 'flex', gap: '1.5rem' }}>
                    {idx < STAGES.length - 1 && <div className="timeline-line" />}
                    <div className="timeline-dot" style={{ 
                      background: isComplete ? 'var(--ink)' : (isActive ? 'var(--accent)' : 'var(--surface)'),
                      borderColor: isComplete ? 'var(--ink)' : (isActive ? 'var(--accent)' : 'var(--border-strong)'),
                      boxShadow: isActive ? '0 0 0 4px var(--accent-subtle)' : 'none'
                    }} />
                    <div style={{ marginTop: '-2px' }}>
                      <div style={{ 
                        fontWeight: isActive ? 700 : (isComplete ? 600 : 500),
                        color: isRejected ? 'var(--rejected)' : (isApproved ? 'var(--approved)' : (isActive ? 'var(--ink)' : (isComplete ? 'var(--ink-secondary)' : 'var(--ink-muted)'))),
                        fontSize: '1rem'
                      }}>
                        {stage.label}
                      </div>
                      {isActive && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--ink-muted)', marginTop: '0.25rem' }}>
                          Updated {formatDate(quote.updated_at)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions & Compliance */}
          <div className="saas-card">
            <h3 className="t-eyebrow" style={{ marginBottom: '1.5rem' }}>APPROVAL CONTROLS</h3>
            
            {quote.approval_required ? (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--submitted)', fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                  <ShieldCheck size={18} /> Exception Approval Required
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#92400e', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {quote.approval_reasons.map((r, i) => (
                    <li key={i}>{r.replace(/_/g, " ")}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--approved)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '2rem' }}>
                <CheckCircle2 size={18} /> Standard Terms (Auto-Approve allowed)
              </div>
            )}

            {actionError && (
              <div className="error-msg" style={{ marginBottom: '1.5rem' }}>{actionError}</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {quote.status === "draft" && (
                <>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', marginBottom: '0.5rem' }}>
                    Submit this quote to initiate the commercial review workflow.
                  </p>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => handleStatusUpdate("submitted")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Submitting…" : "Submit for Review"}
                  </button>
                </>
              )}

              {quote.status === "submitted" && (
                <>
                  <p style={{ fontSize: '0.875rem', color: 'var(--ink-secondary)', marginBottom: '0.5rem' }}>
                    This quote is pending final decision by Deal Desk operations.
                  </p>
                  <button
                    className="btn"
                    style={{ width: '100%', background: 'var(--approved)', color: 'white' }}
                    onClick={() => handleStatusUpdate("approved")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? "Processing…" : "Approve Deal"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%', color: 'var(--rejected)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                    onClick={() => handleStatusUpdate("rejected")}
                    disabled={isUpdating}
                  >
                    Reject Deal
                  </button>
                </>
              )}

              {(quote.status === "approved" || quote.status === "rejected") && (
                <div style={{
                  padding: '1rem',
                  background: 'var(--surface-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.875rem',
                  color: 'var(--ink-muted)',
                  textAlign: 'center',
                  fontWeight: 500
                }}>
                  This record is locked. No further actions available.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
