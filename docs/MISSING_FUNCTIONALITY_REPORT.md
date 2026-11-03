# SKYTHS — Missing Functionality & Implementation Gap Report

## 1. Overview & Objective

This report identifies all missing code statements, incomplete functions, hardcoded mock datasets, unhandled edge cases, and architectural disconnects found across the SKYTHS codebase during Phase 1 inspection. Each identified gap is cataloged with its root cause, business impact, and planned remediation in Phase 9.

---

## 2. Catalog of Identified Gaps

### GAP-01: Hardcoded Mock Data in Corbel Presentation Shell
- **Affected Files**:
  - `src/components/corbel/CorbelProductsView.tsx` (`DEMO_PRODUCTS`)
  - `src/components/corbel/CorbelOrdersView.tsx` (`DEMO_ORDERS`)
  - `src/components/corbel/CorbelCustomersView.tsx` (`DEMO_CUSTOMERS`)
- **Description**: While the UI geometry, animations, and typography replicate the requested modern design, these views rendered static JavaScript array constants instead of connecting to `window.skythsAPI`.
- **Business Impact**: Edits made in POS or inventory management did not reflect in the Corbel views, and newly created customers or orders were invisible.
- **Required Remediation**: Wire `skythsAPI.getProducts()`, `skythsAPI.getSalesHistory()`, and `skythsAPI.getCustomers()` into these views with live loading and state updates.

### GAP-02: Missing Prior Return Verification in Sales Return Processing
- **Affected File**: `electron/services/returnService.ts` (`processSalesReturn`)
- **Description**: The return validation verified `item.quantity > saleItem.quantity`, but did not check cumulative quantities previously returned across multiple return transactions for that sale line.
- **Business Impact**: A customer who purchased 5 items could make multiple successive return transactions (e.g., returning 3 items on day 1 and 3 items on day 2), resulting in 6 items returned and over-refunding money.
- **Required Remediation**: Query `sales_return_items` to compute `already_returned` sum, and validate that `item.quantity <= (saleItem.quantity - already_returned)`.

### GAP-03: Concurrency Race Condition in Sequence Generator
- **Affected File**: `electron/services/businessService.ts` (`getNextSequence`)
- **Description**: `getNextSequence` executed a non-atomic `SELECT` followed by an `UPDATE` on `invoice_sequences` without transaction wrapping.
- **Business Impact**: Rapid concurrent checkouts or returns could read the same `current_number`, producing duplicate invoice numbers (`INV-1005`) and causing unique constraint violations.
- **Required Remediation**: Use an atomic SQLite upsert transaction with `RETURNING current_number` or wrap the read-and-increment in `db.transaction()`.

### GAP-04: Timestamp Collision in Adjustment and Expense Identifiers
- **Affected Files**:
  - `electron/services/productService.ts` (`adjustStock`)
  - `electron/services/financialService.ts` (`createExpense`)
- **Description**: Used `Date.now().toString().slice(-6)` to generate adjustment and expense reference numbers (`ADJ-XXXXXX`, `EXP-XXXXXX`).
- **Business Impact**: Successive adjustments or expenses executed within the same millisecond or cycle would produce identical identifiers, crashing on unique constraint checks.
- **Required Remediation**: Route sequence generation through `BusinessService.getNextSequence('ADJ')` and `BusinessService.getNextSequence('EXP')`.

### GAP-05: Hardcoded Profit Estimation in Dashboard Metrics
- **Affected File**: `electron/services/reportService.ts` (`getDashboardMetrics`)
- **Description**: Daily profit trend computed `profit: Math.round(r.sales * 0.25)` as an arbitrary 25% flat estimate.
- **Business Impact**: Financial trend lines did not accurately reflect real profitability, especially for high-margin or low-margin product sales.
- **Required Remediation**: Join `sale_items` to calculate true daily gross profit: `grand_total - SUM(quantity * cost_price_snapshot)`.

### GAP-06: Classic Enterprise View Accessibility in App Shell
- **Affected File**: `src/App.tsx`
- **Description**: Switching from Corbel mode to classic mode only rendered `PosView`, cutting off access to the 20 other operational views (`PurchasesView`, `FinancialReportsView`, `CustomerStatementModal`, `AuditLogsView`, `UserManagementView`, etc.).
- **Business Impact**: Administrators could not access advanced accounting and audit tools without restarting or modifying source code.
- **Required Remediation**: Provide full bidirectional switching allowing administrators to access the complete operational console with `Sidebar`, `Topbar`, and all 21 views, or seamless embedding into the Corbel navigation.

### GAP-07: Missing Password Strength & Username Validation on Setup
- **Affected File**: `electron/services/authService.ts` (`createAdminUser`)
- **Description**: `createAdminUser` did not validate minimum password length or verify if the username already existed before attempting the insert.
- **Business Impact**: Weak passwords (e.g. single character) could be set during initial setup, or cryptic database constraint errors were surfaced.
- **Required Remediation**: Add minimum 6-character validation and pre-insert duplicate username verification.

### GAP-08: Missing Login Rate Limiting & Brute-Force Safeguards
- **Affected File**: `electron/services/authService.ts` (`login`)
- **Description**: There was no rate limiting or failed attempt tracking on the login endpoint.
- **Business Impact**: An attacker with access to the machine could mount automated brute-force attacks against user passwords.
- **Required Remediation**: Implement in-memory failed attempt tracking with temporary lockout after 5 consecutive failed attempts.

