from app.models.schemas import QuoteCalculateRequest, QuoteLineItemRequest
from app.services.pricing import calculate_quote
import pytest
from fastapi import HTTPException

def test_starter_boundary():
    req = QuoteCalculateRequest(
        customer_name="Test", seats=9, discount_pct=10, annual_commitment=False,
        line_items=[QuoteLineItemRequest(sku="AGENT-CORE", quantity=1)]
    )
    res, _ = calculate_quote(req)
    assert res.tier == "STARTER"

def test_growth_boundary():
    req = QuoteCalculateRequest(
        customer_name="Test", seats=10, discount_pct=20, annual_commitment=False,
        line_items=[QuoteLineItemRequest(sku="AGENT-CORE", quantity=1)]
    )
    res, _ = calculate_quote(req)
    assert res.tier == "GROWTH"

def test_enterprise_boundary():
    req = QuoteCalculateRequest(
        customer_name="Test", seats=50, discount_pct=30, annual_commitment=False,
        line_items=[QuoteLineItemRequest(sku="AGENT-CORE", quantity=1)]
    )
    res, _ = calculate_quote(req)
    assert res.tier == "ENTERPRISE"

def test_discount_approval():
    req = QuoteCalculateRequest(
        customer_name="Test", seats=10, discount_pct=15.01, annual_commitment=False,
        line_items=[QuoteLineItemRequest(sku="AGENT-CORE", quantity=1)]
    )
    res, _ = calculate_quote(req)
    assert res.approval_required == True
    assert "discount_above_15_percent" in res.approval_reasons

def test_total_approval():
    # 25000 / 2500 = 10 onboarding packages + 1 extra to pass 25k
    req = QuoteCalculateRequest(
        customer_name="Test", seats=10, discount_pct=0, annual_commitment=False,
        line_items=[QuoteLineItemRequest(sku="ONBOARDING", quantity=11)]
    )
    res, _ = calculate_quote(req)
    assert res.approval_required == True
    assert "total_above_25000" in res.approval_reasons

def test_annual_commitment_approval():
    req = QuoteCalculateRequest(
        customer_name="Test", seats=10, discount_pct=10.01, annual_commitment=True,
        line_items=[QuoteLineItemRequest(sku="AGENT-CORE", quantity=1)]
    )
    res, _ = calculate_quote(req)
    assert res.approval_required == True
    assert "annual_commitment_discount_above_10_percent" in res.approval_reasons

def test_unknown_sku_validation():
    req = QuoteCalculateRequest(
        customer_name="Test", seats=10, discount_pct=0, annual_commitment=False,
        line_items=[QuoteLineItemRequest(sku="UNKNOWN", quantity=1)]
    )
    with pytest.raises(HTTPException) as exc:
        calculate_quote(req)
    assert exc.value.status_code == 422
    assert "Unknown SKU" in exc.value.detail
