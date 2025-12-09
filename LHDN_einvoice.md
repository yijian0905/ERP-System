# Malaysia LHDN e-Invoice Integration – Full Implementation Prompt (Markdown)

## 1. Overview

You are a senior backend engineer helping me implement **Malaysia LHDN e-Invoice** integration for my **multi-tenant ERP**.

Your task is to design:

1. Local e-Invoice data model
2. A JSON builder that converts internal invoice data to the LHDN-required format
3. A service layer for handling e-Invoice lifecycle
4. An adapter layer (API skeleton) for future integration with LHDN MyInvois API

---

## 2. Database Schema / ORM Models

### `e_invoices`

```

```

```
id (PK)
tenant_id (FK)
company_id (FK)
invoice_id (FK to internal sales invoice)
invoice_type (enum: sales, credit_note, debit_note, refund, self_billed)
status (enum: draft, pending_submission, submitted, accepted, rejected, canceled)
lhdn_uuid (string, nullable)
lhdn_submission_timestamp (datetime, nullable)
lhdn_request_json (JSON / text)
lhdn_response_json (JSON / text)
reject_reason (text, nullable)
created_at
updated_at

```

### `e_invoice_items`

```

```

```
id (PK)
e_invoice_id (FK → e_invoices.id)
item_id (nullable FK to items)
description (string)
quantity (decimal)
unit_price (decimal)
tax_rate (decimal)
tax_code (string)
line_total (decimal)

```

Provide full SQL schema or ORM entity definitions.

---

## 3. e-Invoice JSON Builder

Implement a module/class named `EInvoiceBuilder`:

### Public Method

```

```

```
build(invoiceId) → LHDN-compliant JSON object

```

### Internal Sub-builders

- `buildHeader()`
- `buildSupplier()`
- `buildBuyer()`
- `buildItems()`
- `buildTotals()`
- `buildReferences()` (for Credit Note / Debit Note referencing previous invoice)

### Output

The builder must return a JSON structure compliant with LHDN e-Invoice guidelines, including:

- Invoice metadata
- Supplier info
- Buyer info
- Item details
- Tax details
- Totals
- References

Provide example code or pseudocode with placeholder field mappings:

```

```

```
"LHDNField" := internalInvoice.someField

```

---

## 4. Validation Logic

Before building JSON, validate:

- Supplier has tax ID, address, required fields
- Buyer has required identification fields
- Items are valid (qty, unit price, tax)
- Totals match computed values
- If invoice_type is credit/debit note → reference invoice must exist

Validation must return structured error objects.

---

## 5. e-Invoice Service Skeleton

Implement a service (class/module) named `EInvoiceService` with:

```

```

```
createFromInvoice(invoiceId)
buildAndStoreJson(eInvoiceId)
updateStatus(eInvoiceId, status, details?)
logSubmissionRequest(eInvoiceId, json)
logSubmissionResponse(eInvoiceId, json)

```

This service coordinates:

- Creating e-Invoice record
- Generating JSON
- Updating status
- Logging submissions/responses

---

## 6. LHDN API Adapter (Skeleton Only)

Create a class/interface named `LHDNApiAdapter`:

```

```

```
authenticate(): Promise<Token>

submitInvoice(jsonPayload): Promise<SubmissionResult>

cancelInvoice(lhdn_uuid): Promise<CancelResult>

getInvoiceStatus(lhdn_uuid): Promise<StatusResult>

```

For now, provide method signatures with placeholder logic (no real API calls).