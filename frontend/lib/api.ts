import { Catalog, QuoteCalculateRequest, QuoteCalculationResponse, QuoteResponse, QuoteListItem, QuoteStatus } from '../types';

// Normalize: trim trailing slashes so we never produce //api/catalog
const _rawBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_BASE = _rawBase.replace(/\/+$/, '');

// Warn loudly in development if the env var is missing
if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_API_URL) {
    console.warn(
        '[api] NEXT_PUBLIC_API_URL is not set. ' +
        'Falling back to http://localhost:8000. ' +
        'Create frontend/.env.local and set NEXT_PUBLIC_API_URL=http://localhost:8000'
    );
}

export async function fetchCatalog(): Promise<Catalog> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}/api/catalog`);
    } catch (networkError: any) {
        // Network failure or CORS block — the browser gives no detail for CORS errors
        console.error('[api] fetchCatalog network/CORS error:', networkError);
        throw new Error(
            `Failed to fetch. Ensure the backend is reachable at ${API_BASE}`
        );
    }

    if (!res.ok) {
        console.error(`[api] fetchCatalog HTTP ${res.status} ${res.statusText}`);
        throw new Error(`Backend returned ${res.status} ${res.statusText}`);
    }

    let data: Catalog;
    try {
        data = await res.json();
    } catch {
        throw new Error('Catalog response was not valid JSON');
    }

    if (!data || !data.products || data.products.length === 0) {
        throw new Error('Catalog data is empty or malformed');
    }

    return data;
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
