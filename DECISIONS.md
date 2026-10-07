# Decisions

1. **Duplicate Products**: If the same SKU is added twice, the quantities are merged into one line in the backend before calculation.
2. **0% Discount Representation**: A 0% discount is represented as a float `0.0`. It does not trigger approval.
3. **Money/Rounding Strategy**: All prices and subtotals are represented as standard floats but rounded to 2 decimal places using Python's `round(val, 2)` at every step (line total, subtotal, discount, total). This prevents floating point drift.
4. **Annual Commitment**: Does not alter pricing. It only triggers an approval rule when discount > 10%.
5. **Product Versioning**: The response saves `sku`, `name`, `unit_price`, `quantity`, `line_total` for each line item. If the catalog changes, the saved quote remains intact.
6. **Business Rules**: All business rules (tiers, maximum discounts, approval logic) live entirely in `backend/app/services/pricing.py`. The frontend only displays the results.
7. **Status Transitions**: Valid transitions: `draft` -> `submitted`, `submitted` -> `approved` | `rejected`.
8. **JSON Persistence**: Using a flat file `quotes.json` in `backend/data`. This is not thread-safe or scalable, but fits the MVP requirements.

## What I would improve with another day
- Add a proper PostgreSQL database for transactional safety.
- Add user authentication to track who created/approved quotes.
- Implement soft-deletes and versioning of quotes.
- Provide a richer UI using TailwindCSS for better UX.
