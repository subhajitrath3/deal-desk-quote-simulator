import json
import os
from pathlib import Path
from app.models.schemas import QuoteCalculateRequest, QuoteCalculationResponse, QuoteLineItemResponse
from fastapi import HTTPException

DATA_DIR = Path(__file__).parent.parent.parent / "data"
CATALOG_FILE = DATA_DIR / "catalog.json"

def load_catalog():
    with open(CATALOG_FILE, "r") as f:
        return json.load(f)

def get_pricing_tier(seats: int, catalog: dict) -> str:
    for rule in catalog["discount_rules"]:
        if rule["min_seats"] <= seats <= rule["max_seats"]:
            return rule["code"]
    return "UNKNOWN"

def get_max_discount(tier: str, catalog: dict) -> float:
    for rule in catalog["discount_rules"]:
        if rule["code"] == tier:
            return rule["max_discount_pct"]
    return 0.0

def calculate_quote(request: QuoteCalculateRequest) -> tuple[QuoteCalculationResponse, list[QuoteLineItemResponse]]:
    catalog = load_catalog()
    
    # Validation
    tier = get_pricing_tier(request.seats, catalog)
    max_discount = get_max_discount(tier, catalog)
    
    if request.discount_pct > max_discount:
        raise HTTPException(status_code=422, detail=f"Discount exceeds maximum allowed ({max_discount}%) for tier {tier}")
        
    products_by_sku = {p["sku"]: p for p in catalog["products"]}
    
    # Merge duplicates and calculate line items
    merged_items = {}
    for item in request.line_items:
        if item.sku not in products_by_sku:
            raise HTTPException(status_code=422, detail=f"Unknown SKU: {item.sku}")
        if item.sku in merged_items:
            merged_items[item.sku] += item.quantity
        else:
            merged_items[item.sku] = item.quantity
            
    line_item_responses = []
    subtotal = 0.0
    for sku, quantity in merged_items.items():
        product = products_by_sku[sku]
        unit_price = product["unit_price"]
        line_total = round(quantity * unit_price, 2)
        subtotal += line_total
        line_item_responses.append(
            QuoteLineItemResponse(
                sku=sku,
                name=product["name"],
                unit_price=unit_price,
                quantity=quantity,
                line_total=line_total
            )
        )
        
    subtotal = round(subtotal, 2)
    discount_amount = round(subtotal * (request.discount_pct / 100.0), 2)
    total = round(subtotal - discount_amount, 2)
    
    # Approval rules
    approval_reasons = []
    if request.discount_pct > 15:
        approval_reasons.append("discount_above_15_percent")
    if total > 25000:
        approval_reasons.append("total_above_25000")
    if request.annual_commitment and request.discount_pct > 10:
        approval_reasons.append("annual_commitment_discount_above_10_percent")
        
    response = QuoteCalculationResponse(
        tier=tier,
        subtotal=subtotal,
        discount_amount=discount_amount,
        total=total,
        approval_required=len(approval_reasons) > 0,
        approval_reasons=approval_reasons
    )
    
    return response, line_item_responses
