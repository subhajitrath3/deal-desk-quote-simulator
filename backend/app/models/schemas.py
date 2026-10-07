from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

class QuoteStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"

class QuoteLineItemRequest(BaseModel):
    sku: str
    quantity: int = Field(gt=0)

class QuoteCalculateRequest(BaseModel):
    customer_name: str = Field(..., min_length=1)
    seats: int = Field(gt=0)
    line_items: List[QuoteLineItemRequest] = Field(..., min_length=1)
    discount_pct: float = Field(ge=0)
    annual_commitment: bool

class QuoteLineItemResponse(BaseModel):
    sku: str
    name: str
    unit_price: float
    quantity: int
    line_total: float

class QuoteCalculationResponse(BaseModel):
    tier: str
    subtotal: float
    discount_amount: float
    total: float
    approval_required: bool
    approval_reasons: List[str]

class QuoteCreateRequest(QuoteCalculateRequest):
    pass

class QuoteResponse(QuoteCalculateRequest, QuoteCalculationResponse):
    id: str
    status: QuoteStatus
    created_at: datetime
    updated_at: datetime
    line_items: List[QuoteLineItemResponse]

class QuoteListItem(BaseModel):
    id: str
    customer_name: str
    status: QuoteStatus
    seats: int
    total: float
    created_at: datetime

class StatusUpdateRequest(BaseModel):
    status: QuoteStatus
