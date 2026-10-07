"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchCatalog, calculateQuote, saveQuote } from "../lib/api";
import { Catalog, QuoteCalculateRequest, QuoteCalculationResponse } from "../types";
import { ArrowRight, Save, CheckCircle2, ChevronDown, Check, AlertCircle } from "lucide-react";
import Link from "next/link";

/* ─── helpers ─── */
const fmt = (n: number) =>
  n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function QuoteBuilder() {
  /* ── state: catalog ── */
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  /* ── state: active section ── */
  const [activeSection, setActiveSection] = useState<string | null>(null);

  /* ── state: form fields ── */
  const [customerName, setCustomerName] = useState("");
  const [seats, setSeats] = useState<number | "">("");
  const [discountPct, setDiscountPct] = useState<number | "">("");
  const [annualCommitment, setAnnualCommitment] = useState(false);
  const [lineItems, setLineItems] = useState<{ sku: string; quantity: number | "" }[]>([]);

  /* ── state: calculation ── */
  const [calculation, setCalculation] = useState<QuoteCalculationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);

  /* ── state: save ── */
  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  /* ── state: validation UI ── */
  const [submitted, setSubmitted] = useState(false);

  /* ── catalog load ── */
  useEffect(() => {
    fetchCatalog().then(setCatalog).catch((e) => setCatalogError(e.message));
  }, []);

  /* ── derived: validation ── */
  const customerValid = customerName.trim().length > 0;
  const seatsValid = typeof seats === "number" && seats > 0;
  const discountValid = discountPct === "" || (typeof discountPct === "number" && discountPct >= 0 && discountPct <= 100);
  const lineItemsValid =
    lineItems.length > 0 &&
    lineItems.every((i) => i.sku !== "" && typeof i.quantity === "number" && i.quantity > 0);
  const canCalculate = customerValid && seatsValid && lineItemsValid && discountValid;

  /* ── derived: current pricing tier ── */
  const currentTier = useMemo(() => {
    if (!catalog || !seatsValid) return null;
    return catalog.discount_rules.find(
      (r) => (seats as number) >= r.min_seats && (seats as number) <= r.max_seats
    ) ?? null;
  }, [catalog, seats, seatsValid]);

  /* ── derived: discount warning ── */
  const discountExceedsTier =
    currentTier && typeof discountPct === "number" && discountPct > currentTier.max_discount_pct;

  /* ── mark stale on any input change ── */
  const markStale = () => {
    if (calculation) setIsStale(true);
    setSaveSuccess(false);
    setSavedQuoteId(null);
  };

  /* ── line item helpers ── */
  const addLine = () => {
    setLineItems((prev) => [...prev, { sku: "", quantity: 1 }]);
    markStale();
  };

  const updateLine = (i: number, field: "sku" | "quantity", val: string | number) => {
    setLineItems((prev) => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: val };
      return next;
    });
    markStale();
  };

  const removeLine = (i: number) => {
    setLineItems((prev) => prev.filter((_, idx) => idx !== i));
    markStale();
  };

  /* ── calculate ── */
  const handleCalculate = async () => {
    setSubmitted(true);
    if (!canCalculate) return;
    setCalcError(null);
    setIsCalculating(true);
    try {
      const req: QuoteCalculateRequest = {
        customer_name: customerName.trim(),
        seats: seats as number,
        discount_pct: discountPct === "" ? 0 : (discountPct as number),
        annual_commitment: annualCommitment,
        line_items: lineItems.map((i) => ({ sku: i.sku, quantity: i.quantity as number })),
      };
      const result = await calculateQuote(req);
      setCalculation(result);
      setIsStale(false);
      setSaveSuccess(false);
      setSavedQuoteId(null);
    } catch (e: any) {
      setCalcError(e.message || "Calculation failed.");
    } finally {
      setIsCalculating(false);
    }
  };

  /* ── save ── */
  const handleSave = async () => {
    if (!calculation || isStale || saveSuccess) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      const req: QuoteCalculateRequest = {
        customer_name: customerName.trim(),
        seats: seats as number,
        discount_pct: discountPct === "" ? 0 : (discountPct as number),
        annual_commitment: annualCommitment,
        line_items: lineItems.map((i) => ({ sku: i.sku, quantity: i.quantity as number })),
      };
      const result = await saveQuote(req);
      setSavedQuoteId(result.id);
      setSaveSuccess(true);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  /* ── loading / error ── */
  if (catalogError) {
    return (
      <div className="saas-card" style={{ maxWidth: 520, margin: '4rem auto', borderColor: 'var(--rejected)' }}>
        <h2 style={{ color: 'var(--rejected)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle /> Catalog Unavailable
        </h2>
        <p style={{ marginTop: '1rem', color: 'var(--ink-secondary)' }}>
          {catalogError}. Ensure the backend is running at <code style={{ fontFamily: 'monospace' }}>localhost:8000</code>.
        </p>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--accent)' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid var(--accent-subtle)', borderTopColor: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontWeight: 600, letterSpacing: '0.05em', color: 'var(--ink-secondary)' }}>LOADING CATALOG...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const productMap = Object.fromEntries(catalog.products.map((p) => [p.sku, p]));

  return (
    <div style={{ paddingBottom: '6rem' }}>
      
      {/* ── HERO SECTION ── */}
      <section style={{ 
        padding: '4rem 0 6rem 0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative'
      }}>
        <div className="t-eyebrow" style={{ marginBottom: '1.5rem' }}>
          DEAL DESK • QUOTE WORKSPACE
        </div>
        
        <h1 className="t-hero" style={{ marginBottom: '1.5rem', maxWidth: '800px', lineHeight: 1.1 }}>
          Create the <span style={{ color: 'var(--accent)' }}>perfect deal.</span>
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem', 
          color: 'var(--ink-secondary)',
          maxWidth: '600px',
          marginBottom: '3rem',
          lineHeight: 1.6
        }}>
          Build, validate and review customer quotes with confidence. Manage enterprise sales workflows seamlessly.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-primary"
            onClick={() => {
              document.getElementById('quote-builder')?.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Start a New Quote
          </button>
          <Link href="/quotes" className="btn btn-secondary">
            View Saved Quotes
          </Link>
        </div>

        {/* Decorative Floating Cards in Hero */}
        <div className="float-card float-anim" style={{ position: 'absolute', top: '10%', left: '5%', animationDelay: '0s' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)' }}>DEALS CLOSED</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--ink)' }}>2,405</div>
        </div>
        <div className="float-card float-anim" style={{ position: 'absolute', bottom: '20%', right: '5%', animationDelay: '2s' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-muted)' }}>AVG DISCOUNT</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>12.4%</div>
        </div>
      </section>

      {/* ── QUOTE BUILDER WORKSPACE ── */}
      <div id="quote-builder" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 400px', 
        gap: '2.5rem',
        alignItems: 'flex-start'
      }}>
        
        {/* LEFT COLUMN: FORM SECTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* 01 CUSTOMER */}
          <div 
            className={`saas-card ${activeSection === 'customer' ? 'is-active' : ''}`}
            onFocus={() => setActiveSection('customer')}
            onClick={() => setActiveSection('customer')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.125rem' }}>
                01
              </div>
              <h2 className="t-h2">Who is this deal for?</h2>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label className="saas-label">Customer Name</label>
                <input 
                  type="text" 
                  className={`saas-input ${submitted && !customerValid ? 'is-error' : ''}`}
                  placeholder="e.g. Acme Corporation"
                  value={customerName}
                  onChange={(e) => { setCustomerName(e.target.value); markStale(); }}
                />
                {submitted && !customerValid && (
                  <div className="error-msg">Please enter a customer name.</div>
                )}
              </div>
              <div>
                <label className="saas-label">Licensed Seats</label>
                <input 
                  type="number" 
                  className={`saas-input ${submitted && !seatsValid ? 'is-error' : ''}`}
                  placeholder="e.g. 50"
                  value={seats}
                  onChange={(e) => {
                    const val = e.target.value === "" ? "" : Number(e.target.value);
                    setSeats(val);
                    markStale();
                  }}
                  min="1"
                />
                {submitted && !seatsValid && (
                  <div className="error-msg">Enter a valid seat count.</div>
                )}
                
                {currentTier && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="status-pill status-approved" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                      {currentTier.code} TIER
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 02 PRODUCTS */}
          <div 
            className={`saas-card ${activeSection === 'products' ? 'is-active' : ''}`}
            onFocus={() => setActiveSection('products')}
            onClick={() => setActiveSection('products')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.125rem' }}>
                  02
                </div>
                <div>
                  <h2 className="t-h2">What are they buying?</h2>
                  <p style={{ color: 'var(--ink-muted)', marginTop: '0.25rem' }}>Build the product mix for this quote.</p>
                </div>
              </div>
            </div>

            {submitted && !lineItemsValid && lineItems.length === 0 && (
               <div className="error-msg" style={{ marginBottom: '1.5rem' }}>Please add at least one product.</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {lineItems.map((item, idx) => {
                const isInvalidSku = submitted && item.sku === "";
                const isInvalidQty = submitted && (item.quantity === "" || (item.quantity as number) <= 0);
                
                return (
                  <div key={idx} className="product-card">
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '1rem', alignItems: 'flex-start' }}>
                      <div>
                        <label className="saas-label">Product</label>
                        <div style={{ position: 'relative' }}>
                          <select
                            className={`saas-input ${isInvalidSku ? 'is-error' : ''}`}
                            value={item.sku}
                            onChange={(e) => updateLine(idx, "sku", e.target.value)}
                            style={{ appearance: 'none' }}
                          >
                            <option value="">Select a product...</option>
                            {catalog.products.map((p) => (
                              <option key={p.sku} value={p.sku}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={20} style={{ position: 'absolute', right: '1rem', top: '1rem', color: 'var(--ink-muted)', pointerEvents: 'none' }} />
                        </div>
                        {isInvalidSku && <div className="error-msg">Select a product.</div>}
                        {item.sku && productMap[item.sku] && (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
                            <span className="t-num">${fmt(productMap[item.sku].unit_price)}</span> / unit
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="saas-label">Quantity</label>
                        <input
                          type="number"
                          className={`saas-input ${isInvalidQty ? 'is-error' : ''}`}
                          value={item.quantity}
                          onChange={(e) => {
                            const val = e.target.value === "" ? "" : Number(e.target.value);
                            updateLine(idx, "quantity", val);
                          }}
                          min="1"
                        />
                        {isInvalidQty && <div className="error-msg">Invalid quantity.</div>}
                      </div>
                      <div style={{ paddingTop: '1.75rem' }}>
                        <button
                          onClick={() => removeLine(idx)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--ink-muted)',
                            cursor: 'pointer',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--rejected)'; e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--ink-muted)'; e.currentTarget.style.background = 'transparent'; }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <button 
                onClick={addLine}
                className="btn btn-secondary"
                style={{ width: 'fit-content', marginTop: '1rem', borderStyle: 'dashed' }}
              >
                + Add Product
              </button>
            </div>
          </div>

          {/* 03 PRICING */}
          <div 
            className={`saas-card ${activeSection === 'pricing' ? 'is-active' : ''}`}
            onFocus={() => setActiveSection('pricing')}
            onClick={() => setActiveSection('pricing')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface-secondary)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.125rem' }}>
                03
              </div>
              <h2 className="t-h2">Shape the deal.</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
              <div>
                <label className="saas-label">Discount (%)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    className={`saas-input ${submitted && !discountValid ? 'is-error' : ''}`}
                    placeholder="0"
                    value={discountPct}
                    onChange={(e) => {
                      const val = e.target.value === "" ? "" : Number(e.target.value);
                      setDiscountPct(val);
                      markStale();
                    }}
                    min="0"
                    max="100"
                  />
                  <span style={{ position: 'absolute', right: '1.25rem', top: '1rem', color: 'var(--ink-muted)', fontWeight: 600 }}>%</span>
                </div>
                {submitted && !discountValid && <div className="error-msg">Invalid discount percentage.</div>}
                {discountExceedsTier && currentTier && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <AlertCircle size={14} /> Exceeds {currentTier.max_discount_pct}% tier maximum. Requires approval.
                  </div>
                )}
              </div>
              
              <div>
                <label className="saas-label" style={{ marginBottom: '1rem' }}>Contract Term</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input
                    type="checkbox"
                    className="saas-toggle"
                    checked={annualCommitment}
                    onChange={(e) => {
                      setAnnualCommitment(e.target.checked);
                      markStale();
                    }}
                  />
                  <span style={{ fontWeight: 600, color: annualCommitment ? 'var(--ink)' : 'var(--ink-muted)' }}>
                    Annual Commitment
                  </span>
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--ink-muted)' }}>
                  Applies standard 5% volume discount automatically.
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: STICKY SUMMARY */}
        <div style={{ position: 'sticky', top: '6rem' }}>
          
          <div className="saas-card" style={{ padding: 0 }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)' }}>
              <div className="t-eyebrow" style={{ marginBottom: '1rem' }}>QUOTE SUMMARY</div>
              <h3 className="t-h2" style={{ marginBottom: '0.5rem' }}>
                {customerName || "Customer Name"}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="status-pill status-draft">{seats || 0} SEATS</span>
                {currentTier && (
                  <span className="status-pill status-approved" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>{currentTier.code} TIER</span>
                )}
              </div>
            </div>

            <div style={{ padding: '2rem', background: 'var(--surface-secondary)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-secondary)', fontWeight: 500 }}>
                  <span>Subtotal</span>
                  <span className="t-num">${calculation ? fmt(calculation.subtotal) : "0.00"}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-secondary)', fontWeight: 500 }}>
                  <span>Discount {calculation ? `(${discountPct || 0}%)` : ""}</span>
                  <span className="t-num" style={{ color: calculation?.discount_amount ? 'var(--accent)' : 'inherit' }}>
                    -${calculation ? fmt(calculation.discount_amount) : "0.00"}
                  </span>
                </div>
              </div>

              <div style={{ paddingTop: '1.5rem', borderTop: '2px dashed var(--border-strong)', marginBottom: '2rem' }}>
                <div className="t-eyebrow" style={{ marginBottom: '0.5rem' }}>FINAL TOTAL</div>
                <div className="t-num" style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--ink)', lineHeight: 1 }}>
                  ${calculation ? fmt(calculation.total) : "0.00"}
                </div>
              </div>

              {calculation && calculation.approval_required && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <strong style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rejected)', fontSize: '0.875rem', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                    <AlertCircle size={16} /> Approval Required
                  </strong>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', color: 'var(--rejected)' }}>
                    {calculation.approval_reasons.map((r, i) => (
                      <li key={i}>{r.replace(/_/g, " ")}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '1.25rem' }}
                  onClick={handleCalculate}
                  disabled={isCalculating}
                >
                  {isCalculating ? "Calculating..." : "Calculate Quote"}
                </button>

                <button
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={handleSave}
                  disabled={!calculation || isStale || isSaving || saveSuccess}
                >
                  {isSaving ? "Saving..." : saveSuccess ? "Saved Successfully" : "Save Quote"}
                </button>
              </div>

              {calcError && <div className="error-msg" style={{ marginTop: '1rem', justifyContent: 'center' }}>{calcError}</div>}
              {saveError && <div className="error-msg" style={{ marginTop: '1rem', justifyContent: 'center' }}>{saveError}</div>}

              {saveSuccess && savedQuoteId && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center', animation: 'fadeInDown 0.3s ease' }}>
                  <div style={{ color: 'var(--approved)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    <CheckCircle2 size={18} /> Quote Saved
                  </div>
                  <Link href={`/quotes/${savedQuoteId}`} style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', fontSize: '0.875rem' }}>
                    View Quote Record →
                  </Link>
                </div>
              )}

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
