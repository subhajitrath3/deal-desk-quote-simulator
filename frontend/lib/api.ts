import { Catalog, QuoteCalculateRequest, QuoteCalculationResponse, QuoteResponse, QuoteListItem, QuoteStatus } from '../types';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

export async function fetchCatalog(): Promise<Catalog> {
    const res = await fetch(`${API_BASE}/api/catalog`);
    if (!res.ok) throw new Error('Failed to load catalog');
    return res.json();
}

export async function calculateQuote(data: QuoteCalculateRequest): Promise<QuoteCalculationResponse> {
    const res = await fetch(`${API_BASE}/api/quotes/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to calculate quote');
    }
    return res.json();
}

export async function saveQuote(data: QuoteCalculateRequest): Promise<QuoteResponse> {
    const res = await fetch(`${API_BASE}/api/quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to save quote');
    }
    return res.json();
}

export async function listQuotes(): Promise<QuoteListItem[]> {
    const res = await fetch(`${API_BASE}/api/quotes`);
    if (!res.ok) throw new Error('Failed to load quotes');
    return res.json();
}

export async function getQuote(id: string): Promise<QuoteResponse> {
    const res = await fetch(`${API_BASE}/api/quotes/${id}`);
    if (!res.ok) throw new Error('Failed to load quote');
    return res.json();
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<QuoteResponse> {
    const res = await fetch(`${API_BASE}/api/quotes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Failed to update status');
    }
    return res.json();
}
