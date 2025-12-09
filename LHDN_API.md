# MyInvois e-Invoice API Handbook

> This handbook summarizes the core APIs required to integrate an ERP system with Malaysia’s LHDN MyInvois e-Invoice platform.
> 

---

# 0. API Architecture Overview

The MyInvois system exposes **two base services**:

| Purpose | Base URL | Notes |
| --- | --- | --- |
| **Identity Service** | `{identity_base_url}` | Used for authentication (`/connect/token`). |
| **e-Invoice API Service** | `{einvoice_base_url}` | Used for Submit, Get, Search, Validate, etc. |

### Authentication Model

MyInvois uses **OAuth2 Client Credentials**.

You must obtain a Bearer token and reuse it (TTL ~ 3600 seconds).

**Do NOT request a token on every API call** due to rate limits.

### Content Types

APIs generally accept or return:

- `application/json`
- `application/xml`
- Some responses vary based on `Accept` header.

---

# 1. Authentication – Login as Taxpayer System

This API returns the Bearer token needed for **all** protected e-Invoice APIs.

## Endpoint

```
POST {identity_base_url}/connect/token
Content-Type: application/x-www-form-urlencoded
```

## Suggested Rate Limit

- ~12 requests/min per `client_id`.
- Token TTL ≈ **3600 seconds**, so cache and reuse.

## Request Body (form-encoded)

| Field | Type | Description |
| --- | --- | --- |
| `client_id` | string | Provided by MyInvois |
| `client_secret` | string | Provided by MyInvois |
| `grant_type` | string | Must be `client_credentials` |
| `scope` | string (optional) | Typically `InvoicingAPI` |

## Success Response (200)

```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": "InvoicingAPI"
}
```

## Error Response Example

```json
{
  "error": "invalid_client",
  "error_description": "User blocked"
}
```

---

# 2. Submit Documents (Submit e-Invoices)

This is the **core API** for submitting invoice documents to LHDN.

## Endpoint

```
POST {einvoice_base_url}/api/v1.0/documentsubmissions
Authorization: Bearer {access_token}
Content-Type: application/json
```

## Suggested Rate Limit

- ~100 requests/min per client

## Payload Structure

You submit **one or more** documents in a single submission:

```json
{
  "documents": [
    {
      "format": "JSON",
      "document": "BASE64_ENCODED_FILE",
      "documentHash": "SHA256_HASH",
      "codeNumber": "INV-2024-0001"
    }
  ]
}
```

### Important Fields

| Field | Description |
| --- | --- |
| `format` | Typically `"JSON"` or `"XML"` |
| `document` | Base64-encoded raw JSON/XML e-Invoice |
| `documentHash` | SHA-256 of the original file |
| `codeNumber` | Supplier-side reference (invoice no., etc.) |

> Document schema varies by document type (Invoice, Credit Note, etc.)
> 
> 
> Refer to *Document Type Versions* in the SDK.
> 

## Success Response (200)

You will receive:

- A **submissionUid** (batch identifier)
- For each document:
    - `uuid` (document ID)
    - `internalId` (your own identifier)
    - validation summary (if applicable)

Submission may be:

- fully accepted
- partially accepted
- rejected

---

# 3. Get Submission (Retrieve Submission Summary)

Use this API to check the status of a submission created by `Submit Documents`.

## Endpoint

```
GET {einvoice_base_url}/api/v1.0/documentsubmissions/{submissionUid}?pageNo=1&pageSize=100
Authorization: Bearer {access_token}
```

## Suggested Rate Limit

- ~300 requests/min

## Response Contents

Includes:

- `submissionUid`
- `documentCount`
- `dateTimeReceived` (UTC)
- `overallStatus`
    - `in progress`
    - `valid`
    - `invalid`
    - `partially valid`
- `documentSummary` array
    - Each document contains:
        - `uuid`
        - `internalId`
        - `longId` (used for QR codes / public lookups)
        - issuer/receiver info

---

# 4. Get Document (Raw Document Retrieval)

Retrieves the **exact JSON/XML** of a valid document plus metadata.

## Endpoint

```
GET {einvoice_base_url}/api/v1.0/documents/{uuid}/raw
Authorization: Bearer {access_token}
Accept: application/json
```

## Suggested Rate Limit

- ~60 requests/min

## Response Contains

- `uuid`, `submissionUid`, `longId`, `internalId`
- document type metadata
- invoice totals summary
- original document (raw JSON/XML)

Example usage:

- Show customer-facing invoice
- Download e-Invoice
- Verification dashboard

---

# 5. Get Document Details (Validation & Full Metadata)

Use this API to retrieve the **most complete data**, including validation errors.

This works for **valid and invalid** documents.

## Endpoint

```
GET {einvoice_base_url}/api/v1.0/documents/{uuid}/details
Authorization: Bearer {access_token}
Accept: application/json
```

## Suggested Rate Limit

- ~125 requests/min

## Response Contains

- Status: `Valid`, `Invalid`, `Submitted`, `Cancelled`
- Validation results
- Buyer/supplier metadata
- Amount summary
- Cancellation or rejection timestamps (if applicable)

Useful for:

- Debugging submission failures
- ERP UI for invoice validation
- Audit logs

---

# 6. Search Documents (Flexible Query Engine)

Searches across **all issued/received** documents for a taxpayer.

## Endpoint

```
GET {einvoice_base_url}/api/v1.0/documents/search
Authorization: Bearer {access_token}
```

## Suggested Rate Limit

- ~12 requests/min

## Required Condition

You must supply **at least one** date range:

- Submission date range
    - `submissionDateFrom` / `submissionDateTo`
- Issue date range
    - `issueDateFrom` / `issueDateTo`

Max range is **~31 days**.

## Common Query Parameters

| Parameter | Notes |
| --- | --- |
| `uuid` | Filter by document ID |
| `pageSize`, `pageNo` | Pagination (max pageSize ~100) |
| `invoiceDirection` | Issued / Received |
| `status` | Valid / Invalid / Submitted |
| `documentType` | Invoice / Credit Note / etc. |
| `searchQuery` | Free text search |

Use cases:

- ERP dashboard
- Customer service lookup
- Compliance reports

---

# 7. Taxpayer Validation APIs

These APIs help verify taxpayer identity before issuing an invoice.

## 7.1 Validate Taxpayer’s TIN

Checks whether a TIN is valid.

Useful when creating customers or issuing invoices.

## 7.2 Search Taxpayer’s TIN

Search TIN by:

- Name
- ID type
- ID number

Useful for onboarding new customers.

---

# 8. Get Recent Documents

Returns issued/received documents for the last **31 days**.

Useful for:

- Dashboards
- Recent activity feeds
- Syncing ERP with MyInvois

---

# 9. Implementation Recommendations (Based on Your Tech Stack)

Your backend uses:

- Node.js 20+
- Fastify
- TypeScript
- Prisma (PostgreSQL)
- Redis
- BullMQ
- Zod
- Winston

### Recommended Architecture

| Layer | Responsibility |
| --- | --- |
| **AuthService** | Cache token in Redis, refresh before expiry |
| **EInvoiceBuilder** | Convert internal invoice → LHDN JSON → Base64 → hashed document |
| **ApiAdapter** | Wrap Submit, Get Submission/Document, Search |
| **BullMQ Worker** | Handle submission jobs + retries |
| **Database (Prisma)** | Store submissionUid, uuid, validation status, logs |
| **Scheduler** | Periodically call Get Document / Get Submission to update statuses |

---

# 10. Summary of API Rate Limits (Suggested)

| API | Suggested Limit |
| --- | --- |
| Login | ~12/min |
| Submit Documents | ~100/min |
| Get Submission | ~300/min |
| Get Document | ~60/min |
| Get Document Details | ~125/min |
| Search Documents | ~12/min |