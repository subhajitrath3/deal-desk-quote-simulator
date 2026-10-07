from fastapi import APIRouter, HTTPException
from typing import List
import uuid
from datetime import datetime, timezone

from app.models.schemas import (
    QuoteCalculateRequest, QuoteCalculationResponse,
    QuoteCreateRequest, QuoteResponse, QuoteListItem,
    StatusUpdateRequest, QuoteStatus
)
from app.services.pricing import calculate_quote
from app.repositories.quotes import repository

router = APIRouter()

@router.post("/quotes/calculate")
def calculate_quote_endpoint(request: QuoteCalculateRequest):
    calc_result, line_items = calculate_quote(request)
    # Merging the two responses for the simplified POST calculate requirement
    return {
        **calc_result.model_dump(),
        "line_items": [li.model_dump() for li in line_items]
    }

@router.post("/quotes", response_model=QuoteResponse)
def create_quote(request: QuoteCreateRequest):
    # Recalculate - authoritative
    calc_result, line_items = calculate_quote(request)
    
    quote_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    
    quote = QuoteResponse(
        id=quote_id,
        customer_name=request.customer_name,
        seats=request.seats,
        line_items=line_items,
        discount_pct=request.discount_pct,
        annual_commitment=request.annual_commitment,
        tier=calc_result.tier,
        subtotal=calc_result.subtotal,
        discount_amount=calc_result.discount_amount,
        total=calc_result.total,
        approval_required=calc_result.approval_required,
        approval_reasons=calc_result.approval_reasons,
        status=QuoteStatus.DRAFT,
        created_at=now,
        updated_at=now
    )
    
    return repository.save_quote(quote)

@router.get("/quotes", response_model=List[QuoteListItem])
def list_quotes():
    quotes = repository.list_quotes()
    return [QuoteListItem(**q) for q in quotes]

@router.get("/quotes/{quote_id}", response_model=QuoteResponse)
def get_quote(quote_id: str):
    quote_data = repository.get_quote(quote_id)
    if not quote_data:
        raise HTTPException(status_code=404, detail="Quote not found")
    return QuoteResponse(**quote_data)

@router.patch("/quotes/{quote_id}/status")
def update_status(quote_id: str, request: StatusUpdateRequest):
    quote_data = repository.get_quote(quote_id)
    if not quote_data:
        raise HTTPException(status_code=404, detail="Quote not found")
        
    current_status = QuoteStatus(quote_data["status"])
    new_status = request.status
    
    # Validations
    valid_transitions = {
        QuoteStatus.DRAFT: [QuoteStatus.SUBMITTED],
        QuoteStatus.SUBMITTED: [QuoteStatus.APPROVED, QuoteStatus.REJECTED],
        QuoteStatus.APPROVED: [],
        QuoteStatus.REJECTED: []
    }
    
    if new_status not in valid_transitions[current_status]:
        raise HTTPException(status_code=422, detail=f"Invalid transition from {current_status.value} to {new_status.value}")
        
    updated = repository.update_quote_status(quote_id, new_status)
    return updated
