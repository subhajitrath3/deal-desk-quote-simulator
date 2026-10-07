export type QuoteStatus = 'draft' | 'submitted' | 'approved' | 'rejected';

export interface Product {
    sku: string;
    name: string;
    unit_price: number;
}

export interface DiscountRule {
    code: string;
    min_seats: number;
    max_seats: number;
    max_discount_pct: number;
}

export interface Catalog {
    currency: string;
    discount_rules: DiscountRule[];
    products: Product[];
}

export interface QuoteLineItemRequest {
    sku: string;
    quantity: number;
}

export interface QuoteCalculateRequest {
    customer_name: string;
    seats: number;
    line_items: QuoteLineItemRequest[];
    discount_pct: number;
    annual_commitment: boolean;
}

export interface QuoteLineItemResponse {
    sku: string;
    name: string;
    unit_price: number;
    quantity: number;
    line_total: number;
}

export interface QuoteCalculationResponse {
    tier: string;
    subtotal: number;
    discount_amount: number;
    total: number;
    approval_required: boolean;
    approval_reasons: string[];
    line_items?: QuoteLineItemResponse[];
}

export interface QuoteResponse extends QuoteCalculateRequest, QuoteCalculationResponse {
    id: string;
    status: QuoteStatus;
    created_at: string;
    updated_at: string;
    line_items: QuoteLineItemResponse[];
}

export interface QuoteListItem {
    id: string;
    customer_name: string;
    status: QuoteStatus;
    seats: number;
    total: number;
    created_at: string;
}
