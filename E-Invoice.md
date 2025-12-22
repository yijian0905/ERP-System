# Malaysia E-Invoice (MyInvois) API Integration Specification

> **Document Purpose**: This specification provides AI agents with comprehensive technical details for implementing Malaysia LHDN E-Invoice functionality in ERP systems via API integration.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Authentication & Security](#2-authentication--security)
3. [API Endpoints Reference](#3-api-endpoints-reference)
4. [Document Types](#4-document-types)
5. [Data Structure - 55 Required Fields](#5-data-structure---55-required-fields)
6. [Tax Types & Classification Codes](#6-tax-types--classification-codes)
7. [Business Process Workflows](#7-business-process-workflows)
8. [Validation Rules](#8-validation-rules)
9. [Error Handling](#9-error-handling)
10. [Special Scenarios](#10-special-scenarios)
11. [Database Schema Reference](#11-database-schema-reference)
12. [Code Examples](#12-code-examples)
13. [Implementation Checklist](#13-implementation-checklist)

---

## 1. System Overview

### 1.1 What is MyInvois?

MyInvois is Malaysia's official e-invoicing system operated by LHDN (Inland Revenue Board of Malaysia / Lembaga Hasil Dalam Negeri). It enables real-time validation and storage of B2B, B2C, and B2G transactions.

### 1.2 Key Characteristics

| Aspect | Specification |
|--------|---------------|
| Document Format | XML or JSON (UBL 2.1 Standard) |
| Validation Model | Continuous Transaction Control (CTC) - Real-time validation |
| Cancellation Window | 72 hours from validation timestamp |
| Record Retention | Minimum 7 years |
| API Rate Limit | 60 requests per minute per Client ID (recommended) |

### 1.3 Environment URLs

| Environment | Base URL |
|-------------|----------|
| **Production** | `https://api.myinvois.hasil.gov.my` |
| **Sandbox/Preprod** | `https://preprod-api.myinvois.hasil.gov.my` |
| **SDK Documentation** | `https://sdk.myinvois.hasil.gov.my` |

### 1.4 Implementation Timeline

| Phase | Annual Turnover Threshold | Implementation Date |
|-------|--------------------------|---------------------|
| Phase 1 | > RM 100 million | 1 August 2024 |
| Phase 2 | RM 25 million - RM 100 million | 1 January 2025 |
| Phase 3 | RM 5 million - RM 25 million | 1 July 2025 |
| Phase 4 | ≤ RM 5 million | 1 January 2026 |

**Exemption**: Taxpayers with annual turnover < RM 1,000,000 are exempt.

---

## 2. Authentication & Security

### 2.1 OAuth 2.0 Authentication Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   ERP System    │────▶│  Identity Server │────▶│  MyInvois API   │
│                 │     │                 │     │                 │
│ 1. Request Token│     │ 2. Validate     │     │ 4. API Calls    │
│    (Client ID + │     │    Credentials  │     │    with Bearer  │
│    Client Secret)│    │ 3. Return Token │     │    Token        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### 2.2 Token Request

**Endpoint**: `POST /connect/token`

**Request Headers**:
```http
Content-Type: application/x-www-form-urlencoded
```

**Request Body**:
```
grant_type=client_credentials
&client_id={YOUR_CLIENT_ID}
&client_secret={YOUR_CLIENT_SECRET}
&scope=InvoicingAPI
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "InvoicingAPI"
}
```

### 2.3 Digital Certificate Requirements

| Requirement | Details |
|-------------|---------|
| Certificate Authority | Must be issued by MCMC-licensed CA (see https://www.mcmc.gov.my/en/sectors/digital-signature/list-of-licensees) |
| Certificate Types | Soft Certificate (local machine) or Roaming Certificate (server) |
| Purpose | Sign documents to verify issuer identity and ensure integrity |
| Service Provider Option | Can use provider's certificate to submit for all customers |

### 2.4 API Request Headers

```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
Accept-Language: en
```

---

## 3. API Endpoints Reference

### 3.1 Platform APIs

#### 3.1.1 Login as Taxpayer

**Purpose**: Authenticate and obtain access token for taxpayer operations.

```
POST /connect/token
```

#### 3.1.2 Login as Intermediary

**Purpose**: Authenticate intermediary/service provider acting on behalf of taxpayers.

```
POST /connect/token
```

### 3.2 E-Invoice APIs

#### 3.2.1 Validate Taxpayer's TIN

**Purpose**: Verify TIN validity before including in invoice.

```
GET /api/v1.0/taxpayer/validate/{tin}?idType={idType}&idValue={idValue}
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| tin | string | Yes | Tax Identification Number to validate |

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| idType | string | Yes | ID type: `NRIC`, `PASSPORT`, `BRN`, `ARMY` |
| idValue | string | Yes | ID value corresponding to idType |

**Response (Success)**:
```json
{
  "tin": "C1234567890",
  "name": "ABC Sdn Bhd",
  "idType": "BRN",
  "idValue": "202001012345"
}
```

---

#### 3.2.2 Submit Documents

**Purpose**: Submit one or more signed e-invoices for validation.

```
POST /api/v1.0/documentsubmissions
```

**Request Body**:
```json
{
  "documents": [
    {
      "format": "JSON",
      "documentHash": "SHA256_HASH_OF_DOCUMENT",
      "codeNumber": "INV-2025-00001",
      "document": "BASE64_ENCODED_DOCUMENT_CONTENT"
    }
  ]
}
```

**Document Hash Calculation**:
```javascript
// Step 1: Serialize document to JSON string (minified, no whitespace)
// Step 2: Calculate SHA-256 hash
// Step 3: Convert to Base64 string
const documentHash = btoa(sha256(JSON.stringify(document)));
```

**Response (Success)**:
```json
{
  "submissionUid": "SUBM-2025-00001",
  "acceptedDocuments": [
    {
      "uuid": "F9D425P6DS7D8IU",
      "invoiceCodeNumber": "INV-2025-00001",
      "longId": "F9D425P6DS7D8IU-1234567890123456789012345678901234567890"
    }
  ],
  "rejectedDocuments": []
}
```

**Response (Partial Failure)**:
```json
{
  "submissionUid": "SUBM-2025-00002",
  "acceptedDocuments": [],
  "rejectedDocuments": [
    {
      "invoiceCodeNumber": "INV-2025-00002",
      "error": {
        "code": "INVALID_TIN",
        "message": "Supplier TIN is not valid",
        "propertyPath": "Invoice.AccountingSupplierParty.Party.PartyIdentification"
      }
    }
  ]
}
```

---

#### 3.2.3 Cancel Document

**Purpose**: Cancel a previously validated document (within 72 hours).

```
PUT /api/v1.0/documents/state/{uuid}/state
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| uuid | string | Yes | IRBM Unique Identifier of the document |

**Request Body**:
```json
{
  "status": "cancelled",
  "reason": "Incorrect invoice amount"
}
```

**Response (Success)**:
```json
{
  "uuid": "F9D425P6DS7D8IU",
  "status": "cancelled"
}
```

---

#### 3.2.4 Reject Document

**Purpose**: Buyer rejects received invoice (within 72 hours).

```
PUT /api/v1.0/documents/state/{uuid}/state
```

**Request Body**:
```json
{
  "status": "rejected",
  "reason": "Incorrect buyer details"
}
```

---

#### 3.2.5 Get Recent Documents

**Purpose**: Retrieve documents from the last 31 days.

```
GET /api/v1.0/documents/recent?pageNo={pageNo}&pageSize={pageSize}
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| pageNo | integer | No | 1 | Page number |
| pageSize | integer | No | 10 | Results per page (max 100) |
| submissionDateFrom | datetime | No | - | Filter by submission date |
| submissionDateTo | datetime | No | - | Filter by submission date |
| issueDateFrom | date | No | - | Filter by issue date |
| issueDateTo | date | No | - | Filter by issue date |
| direction | string | No | - | `Sent` or `Received` |
| status | string | No | - | `Valid`, `Invalid`, `Cancelled` |
| documentType | string | No | - | Document type code |
| receiverId | string | No | - | Receiver TIN |
| receiverIdType | string | No | - | Receiver ID type |
| issuerId | string | No | - | Issuer TIN |
| issuerIdType | string | No | - | Issuer ID type |

**Response**:
```json
{
  "result": [
    {
      "uuid": "F9D425P6DS7D8IU",
      "submissionUid": "SUBM-2025-00001",
      "longId": "F9D425P6DS7D8IU-123456...",
      "internalId": "INV-2025-00001",
      "typeName": "Invoice",
      "typeVersionName": "1.1",
      "issuerTin": "C1234567890",
      "issuerName": "Supplier Sdn Bhd",
      "receiverId": "C0987654321",
      "receiverName": "Buyer Sdn Bhd",
      "dateTimeIssued": "2025-01-15T10:30:00Z",
      "dateTimeReceived": "2025-01-15T10:30:05Z",
      "dateTimeValidated": "2025-01-15T10:30:10Z",
      "totalExcludingTax": 1000.00,
      "totalNetAmount": 1000.00,
      "totalPayableAmount": 1060.00,
      "status": "Valid",
      "cancelDateTime": null,
      "rejectRequestDateTime": null,
      "documentStatusReason": null
    }
  ],
  "metadata": {
    "totalPages": 5,
    "totalCount": 48
  }
}
```

---

#### 3.2.6 Get Submission

**Purpose**: Get details of a specific submission batch.

```
GET /api/v1.0/documentsubmissions/{submissionUid}
```

**Response**:
```json
{
  "submissionUid": "SUBM-2025-00001",
  "documentCount": 5,
  "dateTimeReceived": "2025-01-15T10:30:00Z",
  "overallStatus": "Valid",
  "documentSummary": [
    {
      "uuid": "F9D425P6DS7D8IU",
      "invoiceCodeNumber": "INV-2025-00001",
      "status": "Valid",
      "longId": "F9D425P6DS7D8IU-123456..."
    }
  ]
}
```

---

#### 3.2.7 Get Document

**Purpose**: Retrieve full document content in original format (XML/JSON).

```
GET /api/v1.0/documents/{uuid}/raw
```

**Response Headers**:
```http
Content-Type: application/json  (or application/xml)
```

**Response**: Original document content plus metadata.

---

#### 3.2.8 Get Document Details

**Purpose**: Get document details including validation results.

```
GET /api/v1.0/documents/{uuid}/details
```

**Response**:
```json
{
  "uuid": "F9D425P6DS7D8IU",
  "submissionUid": "SUBM-2025-00001",
  "longId": "F9D425P6DS7D8IU-123456...",
  "internalId": "INV-2025-00001",
  "typeName": "Invoice",
  "typeVersionName": "1.1",
  "issuerTin": "C1234567890",
  "dateTimeIssued": "2025-01-15T10:30:00Z",
  "dateTimeValidated": "2025-01-15T10:30:10Z",
  "status": "Valid",
  "validationResults": {
    "status": "Valid",
    "validationSteps": [
      {
        "name": "StructureValidation",
        "status": "Valid"
      },
      {
        "name": "CoreFieldsValidation", 
        "status": "Valid"
      },
      {
        "name": "SignatureValidation",
        "status": "Valid"
      },
      {
        "name": "TaxpayerValidation",
        "status": "Valid"
      }
    ]
  }
}
```

---

#### 3.2.9 Search Documents

**Purpose**: Search documents with various filters (beyond 31 days).

```
GET /api/v1.0/documents?{query_parameters}
```

Same parameters as Get Recent Documents, but without the 31-day limitation.

---

#### 3.2.10 Search Taxpayer's TIN

**Purpose**: Search for TIN using name or ID details.

```
GET /api/v1.0/taxpayer?{query_parameters}
```

**Query Parameters** (at least one required):
| Parameter | Type | Description |
|-----------|------|-------------|
| taxpayerName | string | Taxpayer name (partial match) |
| idType | string | ID type |
| idValue | string | ID value |

---

#### 3.2.11 Taxpayer's QR Code

**Purpose**: Retrieve taxpayer info from QR code data.

```
GET /api/v1.0/taxpayer/qrcode/{qrCodeData}
```

---

## 4. Document Types

### 4.1 Document Type Codes

| Code | Type Name | Description | Use Case |
|------|-----------|-------------|----------|
| **01** | Invoice | Standard invoice | Proof of income |
| **02** | Credit Note | Credit adjustment | Reduce value without refund |
| **03** | Debit Note | Debit adjustment | Additional charges |
| **04** | Refund Note | Refund document | Return of monies |
| **11** | Self-Billed Invoice | Self-billing invoice | Foreign suppliers, agents |
| **12** | Self-Billed Credit Note | Self-billing credit | Adjust self-billed invoice |
| **13** | Self-Billed Debit Note | Self-billing debit | Additional charges on self-billed |
| **14** | Self-Billed Refund Note | Self-billing refund | Refund on self-billed |

### 4.2 Document Versions

| Version | Signature Validation | Status |
|---------|---------------------|--------|
| 1.0 | Disabled | Will be deprecated |
| 1.1 | Enabled | **Recommended** |

### 4.3 Self-Billed Invoice Scenarios

Self-billed e-invoices are required when:

1. **Foreign Suppliers**: Goods/services from foreign suppliers
2. **Agents/Dealers/Distributors**: Commission payments
3. **Profit Distribution**: Dividends, profit sharing
4. **Non-Business Individuals**: Transactions with individuals not conducting business
5. **Financial Institutions**: Interest charges to the public
6. **Betting/Gaming**: Winnings/payouts
7. **e-Commerce**: Payments to sellers by platforms

---

## 5. Data Structure - 55 Required Fields

### 5.1 Field Categories Overview

```
55 Data Fields
├── Parties (2 fields)
├── Supplier's Details (7 fields)
├── Buyer's Details (4 fields)
├── Address (2 fields)
├── Contact Number (2 fields)
├── Invoice Details (10 fields)
├── Products/Services (20 fields)
└── Payment Info (7 fields)
```

### 5.2 Complete Field Reference

#### Category 1: Parties

| # | Field Name | Data Type | Max Length | Required | Description |
|---|------------|-----------|------------|----------|-------------|
| 1 | Supplier's Name | String | 300 | **Mandatory** | Legal name of invoice issuer |
| 2 | Buyer's Name | String | 300 | **Mandatory** | Legal name of invoice recipient |

#### Category 2: Supplier's Details

| # | Field Name | Data Type | Max Length | Required | Description |
|---|------------|-----------|------------|----------|-------------|
| 3 | Supplier's TIN | String | 14 | **Mandatory** | IRBM-assigned Tax ID. Prefix: C, IG, etc. |
| 4 | Supplier's Registration Number | String | 20 | **Mandatory** | SSM BRN (12 digits) / MyKad / Passport |
| 5 | Supplier's SST Registration Number | String | 17 | **Conditional** | Required if SST registered |
| 6 | Supplier's Tourism Tax Registration Number | String | 17 | **Conditional** | Required if tourism tax registered |
| 7 | Supplier's Email | String | 320 | Optional | Contact email |
| 8 | Supplier's MSIC Code | String | 5 | **Mandatory** | Malaysia Standard Industrial Classification |
| 9 | Supplier's Business Activity Description | String | 300 | **Mandatory** | Business activity description |

#### Category 3: Buyer's Details

| # | Field Name | Data Type | Max Length | Required | Description |
|---|------------|-----------|------------|----------|-------------|
| 10 | Buyer's TIN | String | 14 | **Mandatory** | Buyer's Tax ID |
| 11 | Buyer's Registration Number | String | 20 | **Mandatory** | BRN / MyKad / Passport |
| 12 | Buyer's SST Registration Number | String | 17 | **Conditional** | Required if SST registered |
| 13 | Buyer's Email | String | 320 | Optional | Contact email |

#### Category 4: Address

| # | Field Name | Data Type | Max Length | Required | Description |
|---|------------|-----------|------------|----------|-------------|
| 14 | Supplier's Address | Object | - | **Mandatory** | Full address with line, city, postal, state, country |
| 15 | Buyer's Address | Object | - | **Mandatory** | Full address with line, city, postal, state, country |

**Address Object Structure**:
```json
{
  "addressLine1": "No. 123, Jalan ABC",
  "addressLine2": "Taman XYZ",
  "addressLine3": "",
  "postalZone": "50000",
  "cityName": "Kuala Lumpur",
  "state": "14",
  "country": "MYS"
}
```

#### Category 5: Contact Number

| # | Field Name | Data Type | Max Length | Required | Description |
|---|------------|-----------|------------|----------|-------------|
| 16 | Supplier's Contact Number | String | 20 | **Mandatory** | Phone number with country code |
| 17 | Buyer's Contact Number | String | 20 | **Mandatory** | Phone number with country code |

#### Category 6: Invoice Details

| # | Field Name | Data Type | Max Length | Required | Description |
|---|------------|-----------|------------|----------|-------------|
| 18 | e-Invoice Version | String | 5 | **Mandatory** | "1.0" or "1.1" |
| 19 | e-Invoice Type | String | 2 | **Mandatory** | Type code (01-14) |
| 20 | e-Invoice Code/Number | String | 50 | **Mandatory** | Internal reference number |
| 21 | Original e-Invoice Reference Number | String | 50 | **Conditional** | IRBM UUID of original invoice (for CN/DN/Refund) |
| 22 | e-Invoice Date and Time | DateTime | - | **Mandatory** | UTC format: YYYY-MM-DDTHH:mm:ssZ |
| 23 | Issuer's Digital Signature | String | - | **Mandatory** | Base64 encoded signature |
| 24 | Invoice Currency Code | String | 3 | **Mandatory** | ISO 4217 code (e.g., MYR, USD) |
| 25 | Currency Exchange Rate | Decimal | - | **Conditional** | Required if non-MYR currency |
| 26 | Frequency of Billing | String | 50 | Optional | Daily, Weekly, Monthly, etc. |
| 27 | Billing Period | Object | - | Optional | Start and end dates |

#### Category 7: Products/Services (Line Items)

| # | Field Name | Data Type | Level | Required | Description |
|---|------------|-----------|-------|----------|-------------|
| 28 | Classification | String | Line | **Mandatory** | Classification code |
| 29 | Description | String | Line | **Mandatory** | Product/service description |
| 30 | Unit Price | Decimal | Line | **Mandatory** | Price per unit |
| 31 | Tax Type | String | Both | **Mandatory** | Tax type code |
| 32 | Tax Rate | Decimal | Both | **Conditional** | Tax percentage |
| 33 | Tax Amount | Decimal | Both | **Mandatory** | Calculated tax |
| 34 | Details of Tax Exemption | String | Line | **Conditional** | Exemption description |
| 35 | Amount Exempted from Tax | Decimal | Line | **Conditional** | Exempt amount |
| 36 | Subtotal | Decimal | Line | **Mandatory** | Line item total excl. tax |
| 37 | Total Excluding Tax | Decimal | Both | **Mandatory** | Total before tax |
| 38 | Total Including Tax | Decimal | Invoice | **Mandatory** | Total with tax |
| 39 | Total Net Amount | Decimal | Invoice | Optional | Total after discounts |
| 40 | Total Payable Amount | Decimal | Invoice | **Mandatory** | Final amount due |
| 41 | Rounding Amount | Decimal | Invoice | Optional | Rounding adjustment |
| 42 | Total Taxable Amount Per Tax Type | Decimal | Invoice | Optional | Tax breakdown |
| 43 | Quantity | Decimal | Line | Optional | Number of units |
| 44 | Measurement | String | Line | Optional | Unit of measure |
| 45 | Discount Rate | Decimal | Both | Optional | Discount percentage |
| 46 | Discount Amount | Decimal | Both | Optional | Discount value |
| 47 | Fee/Charge Rate | Decimal | Both | Optional | Additional fee % |
| 48 | Fee/Charge Amount | Decimal | Both | Optional | Additional fee value |

#### Category 8: Payment Info

| # | Field Name | Data Type | Max Length | Required | Description |
|---|------------|-----------|------------|----------|-------------|
| 49 | Payment Mode | String | 30 | Optional | Cash, Cheque, Bank Transfer, etc. |
| 50 | Supplier's Bank Account Number | String | 150 | Optional | Bank account for payment |
| 51 | Payment Terms | String | 500 | Optional | Payment conditions |
| 52 | Prepayment Amount | Decimal | - | Optional | Advance payment |
| 53 | Prepayment Date | Date | - | Optional | Date of prepayment |
| 54 | Prepayment Reference Number | String | 50 | Optional | Prepayment tracking ID |
| 55 | Bill Reference Number | String | 50 | Optional | Internal billing reference |

### 5.3 Special TIN Values

| TIN | Usage Scenario |
|-----|----------------|
| `EI00000000010` | Malaysian individual buyer without TIN |
| `EI00000000020` | Foreign buyer without TIN |
| `EI00000000030` | Foreign supplier (for self-billing) |
| `EI00000000040` | Governmental bodies/local authorities |

### 5.4 TIN Format Rules

**Individual TIN (Prefix IG)**:
- New format uses `IG` prefix (replacing old `OG`, `SG`)
- Example: `IG123456789` (max 14 chars including prefix)

**Non-Individual TIN (Prefix C, CS, D, F, FA, PT, TA, TC, TN, TR, TP, J, LE)**:
- Remove leading zeros after prefix
- Add trailing zero if needed
- Example: `C01234567890` → `C1234567890`
- Example: `C123456789` → `C1234567890`

---

## 6. Tax Types & Classification Codes

### 6.1 Tax Type Codes

| Code | Description | Rate |
|------|-------------|------|
| 01 | Sales Tax | Variable (5%, 10%) |
| 02 | Service Tax | 6%, 8% |
| 03 | Tourism Tax | RM10 per room per night |
| 04 | High-Value Goods Tax | 5%-10% |
| 05 | Sales Tax on Low Value Goods | 10% |
| 06 | Not Applicable | 0% |
| E | Tax Exempt | 0% |

### 6.2 Tax Exemption Details Codes

| Code | Description |
|------|-------------|
| EXSST-01 | Sales Tax Exemption Certificate |
| EXSST-02 | Tax-free area exemption |
| EXSST-03 | Approved Trader Scheme |
| EXSVT-01 | Service Tax Exemption |
| EXSVT-02 | Group relief |
| OTHER | Other exemption (specify) |

### 6.3 Classification Codes (Sample)

| Code | Description | Category |
|------|-------------|----------|
| 001 | General Expenses | Expense |
| 002 | Raw Materials | Inventory |
| 003 | Services | Service |
| 004 | Self-Billed - Foreign Supplier | Self-Billed |
| 005 | Self-Billed - Agent Commission | Self-Billed |
| 006 | Medical Expenses | Expense |
| 007 | Donations | Donation |

> **Note**: Full classification code list available at https://sdk.myinvois.hasil.gov.my/codes/

### 6.4 Payment Mode Codes

| Code | Description |
|------|-------------|
| 01 | Cash |
| 02 | Cheque |
| 03 | Bank Transfer |
| 04 | Credit Card |
| 05 | Debit Card |
| 06 | e-Wallet / Digital Wallet |
| 07 | Others |

### 6.5 State Codes (Malaysia)

| Code | State |
|------|-------|
| 01 | Johor |
| 02 | Kedah |
| 03 | Kelantan |
| 04 | Melaka |
| 05 | Negeri Sembilan |
| 06 | Pahang |
| 07 | Pulau Pinang |
| 08 | Perak |
| 09 | Perlis |
| 10 | Selangor |
| 11 | Terengganu |
| 12 | Sabah |
| 13 | Sarawak |
| 14 | Wilayah Persekutuan Kuala Lumpur |
| 15 | Wilayah Persekutuan Labuan |
| 16 | Wilayah Persekutuan Putrajaya |
| 17 | Not Applicable |

---

## 7. Business Process Workflows

### 7.1 Standard Invoice Issuance Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPPLIER WORKFLOW                                 │
└─────────────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 1. Create   │────▶│ 2. Validate │────▶│ 3. Generate │
│    Invoice  │     │    Data     │     │   XML/JSON  │
│    in ERP   │     │    Fields   │     │   (UBL 2.1) │
└─────────────┘     └─────────────┘     └─────────────┘
                                              │
                                              ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 6. Receive  │◀────│ 5. Submit   │◀────│ 4. Apply    │
│    Response │     │    to API   │     │   Digital   │
│    + UUID   │     │             │     │   Signature │
└─────────────┘     └─────────────┘     └─────────────┘
     │
     ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ 7. Generate │────▶│ 8. Share    │────▶│ 9. Store    │
│    QR Code  │     │    with     │     │    Record   │
│             │     │    Buyer    │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 7.2 Validation Response Handling

```
Submit Documents API Response
            │
            ▼
    ┌───────────────┐
    │ Check Status  │
    └───────────────┘
            │
     ┌──────┴──────┐
     │             │
     ▼             ▼
┌─────────┐   ┌─────────┐
│ VALID   │   │ INVALID │
└─────────┘   └─────────┘
     │             │
     ▼             ▼
┌─────────────┐  ┌─────────────┐
│ Store UUID  │  │ Parse Error │
│ Start 72hr  │  │ Log Issue   │
│ Timer       │  │ Fix & Retry │
└─────────────┘  └─────────────┘
```

### 7.3 72-Hour Cancellation/Rejection Flow

```
                    Document Validated
                           │
                           ▼
              ┌────────────────────────┐
              │    72-Hour Window      │
              │    COUNTDOWN ACTIVE    │
              └────────────────────────┘
                    │            │
        ┌───────────┘            └───────────┐
        ▼                                    ▼
┌───────────────┐                   ┌───────────────┐
│ SUPPLIER      │                   │ BUYER         │
│ Self-Cancel   │                   │ Request       │
│               │                   │ Rejection     │
└───────────────┘                   └───────────────┘
        │                                    │
        │                                    ▼
        │                           ┌───────────────┐
        │                           │ Supplier      │
        │                           │ Reviews       │
        │                           └───────────────┘
        │                                    │
        │                           ┌────────┴────────┐
        │                           ▼                 ▼
        │                    ┌───────────┐     ┌───────────┐
        │                    │ Approve   │     │ Reject    │
        │                    │ → Cancel  │     │ → No      │
        │                    │           │     │   Cancel  │
        │                    └───────────┘     └───────────┘
        │                           │
        └───────────────────────────┘
                    │
                    ▼
           ┌───────────────┐
           │   CANCELLED   │
           │ Issue New Inv │
           │ If Needed     │
           └───────────────┘

                After 72 Hours
                      │
                      ▼
         ┌────────────────────────┐
         │ CANCELLATION NOT       │
         │ ALLOWED                │
         │ Use CN/DN/Refund       │
         │ for adjustments        │
         └────────────────────────┘
```

### 7.4 Credit Note / Debit Note Flow

```
Original Invoice (Status: Valid)
            │
            ▼
┌─────────────────────────────┐
│ Adjustment Required After   │
│ 72 Hours                    │
└─────────────────────────────┘
            │
     ┌──────┴──────┐──────────────┐
     │             │              │
     ▼             ▼              ▼
┌─────────┐  ┌─────────┐    ┌─────────┐
│ CREDIT  │  │ DEBIT   │    │ REFUND  │
│ NOTE    │  │ NOTE    │    │ NOTE    │
│         │  │         │    │         │
│ Reduce  │  │ Add     │    │ Return  │
│ Value   │  │ Charges │    │ Money   │
└─────────┘  └─────────┘    └─────────┘
     │             │              │
     └──────┬──────┴──────────────┘
            │
            ▼
┌─────────────────────────────┐
│ Reference Original Invoice  │
│ UUID in Document           │
└─────────────────────────────┘
            │
            ▼
┌─────────────────────────────┐
│ Submit via API              │
│ (Same flow as new invoice)  │
└─────────────────────────────┘
```

### 7.5 Consolidated Invoice Flow (B2C)

```
                 Multiple B2C Transactions
                 (Buyer doesn't need e-Invoice)
                           │
     ┌─────────────────────┼─────────────────────┐
     │                     │                     │
     ▼                     ▼                     ▼
┌─────────┐          ┌─────────┐          ┌─────────┐
│ Trans 1 │          │ Trans 2 │          │ Trans N │
│ Receipt │          │ Receipt │          │ Receipt │
└─────────┘          └─────────┘          └─────────┘
     │                     │                     │
     └─────────────────────┼─────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Month End              │
              │ Aggregate Transactions │
              └────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Submit Consolidated    │
              │ E-Invoice              │
              │ Within 7 Calendar Days │
              │ After Month End        │
              └────────────────────────┘
```

### 7.6 Self-Billed Invoice Flow (Import)

```
┌─────────────────────────────────────────────────────────────────────┐
│               IMPORT FROM FOREIGN SUPPLIER                          │
└─────────────────────────────────────────────────────────────────────┘

Foreign Supplier
(Not in MyInvois)
        │
        │ Invoice
        ▼
┌───────────────┐
│ Malaysian     │
│ Buyer         │
│ (You)         │
└───────────────┘
        │
        ▼
┌─────────────────────────────┐
│ Issue Self-Billed Invoice   │
│                             │
│ • Document Type: 11         │
│ • Supplier TIN: EI00000030  │
│   (if no foreign TIN)       │
│ • Buyer = Your Company      │
│ • Classification: Self-Bill │
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ Submit to MyInvois          │
│ Deadline: End of month      │
│ following:                  │
│ - Customs clearance (goods) │
│ - Payment/receipt (services)│
└─────────────────────────────┘
        │
        ▼
┌─────────────────────────────┐
│ Validated Self-Billed       │
│ = Proof of Expense          │
│ (No need to share with      │
│  foreign supplier)          │
└─────────────────────────────┘
```

---

## 8. Validation Rules

### 8.1 Validation Types

| Type | Timing | Description |
|------|--------|-------------|
| **Structure Validator** | Immediate | UBL 2.1 schema compliance |
| **Core Fields Validator** | Immediate | Mandatory fields presence |
| **Signature Validator** | Background | Digital signature verification |
| **Taxpayer Validator** | Background | TIN validity check |
| **Referenced Documents Validator** | Background | Original invoice exists (for CN/DN) |
| **Code Validator** | Both | Valid codes (currency, tax, state) |
| **Duplicate Document Validator** | Background | Prevent duplicate submissions |

### 8.2 Field Validation Rules

| Field | Validation Rule |
|-------|-----------------|
| Date Fields | Format: YYYY-MM-DD (no "N/A" allowed) |
| DateTime Fields | Format: YYYY-MM-DDTHH:mm:ssZ (UTC) |
| Issue Date/Time | Must be current date/time (within tolerance) |
| Supplier Bank Account | Max 150 characters |
| e-Invoice Code/Number | Max 50 characters |
| Authorisation Number | Max 300 characters |
| TIN | Valid format with correct prefix |
| Currency | ISO 4217 code |
| Country | ISO 3166-1 alpha-3 code |
| State | Valid Malaysia state code |

### 8.3 Business Validation Rules

| Rule | Description |
|------|-------------|
| **72-Hour Limit** | Cancellation only within 72 hours of validation |
| **Reference Required** | CN/DN/Refund must reference valid original invoice |
| **Self-Billing Authorization** | Self-billed only for permitted scenarios |
| **Tax Calculation** | Tax amount must match rate × taxable amount |
| **Total Consistency** | Total = Sum(line items) + tax - discount + charges |

---

## 9. Error Handling

### 9.1 Common Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `INVALID_STRUCTURE` | Document doesn't match UBL 2.1 schema | Check XML/JSON structure |
| `MISSING_MANDATORY_FIELD` | Required field is empty | Populate the field |
| `INVALID_TIN` | TIN format incorrect or not registered | Verify TIN with validation API |
| `INVALID_DATE_FORMAT` | Date not in required format | Use YYYY-MM-DD or ISO 8601 |
| `INVALID_SIGNATURE` | Digital signature verification failed | Re-sign document |
| `DUPLICATE_DOCUMENT` | Document already submitted | Check existing submissions |
| `REFERENCE_NOT_FOUND` | Original invoice UUID not found | Verify reference UUID |
| `CANCELLATION_EXPIRED` | 72-hour window passed | Use CN/DN/Refund instead |
| `UNAUTHORIZED` | Token expired or invalid | Refresh access token |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement backoff strategy |

### 9.2 Error Response Structure

```json
{
  "error": {
    "code": "INVALID_TIN",
    "message": "The supplier TIN is not valid or not registered",
    "target": "Invoice.AccountingSupplierParty.Party.PartyIdentification",
    "details": [
      {
        "code": "TIN_NOT_FOUND",
        "message": "TIN C1234567890 not found in IRBM database"
      }
    ]
  }
}
```

### 9.3 Retry Strategy

```
Retry Logic:
├── 4xx Errors (Client): Do NOT retry, fix data first
├── 5xx Errors (Server): Retry with exponential backoff
│   ├── Attempt 1: Wait 1 second
│   ├── Attempt 2: Wait 2 seconds
│   ├── Attempt 3: Wait 4 seconds
│   ├── Attempt 4: Wait 8 seconds
│   └── Attempt 5: Wait 16 seconds, then fail
├── 429 (Rate Limit): Wait for Retry-After header duration
└── Network Timeout: Retry up to 3 times
```

---

## 10. Special Scenarios

### 10.1 Cross-Border Transactions

#### Export (Sell to Foreign Buyer)

| Field | Value |
|-------|-------|
| Buyer TIN | `EI00000000020` (if no foreign TIN) |
| Buyer BRN | Foreign registration number (if available) |
| Buyer Address | Full foreign address |
| Currency | Transaction currency (e.g., USD) |
| Exchange Rate | Rate to convert to MYR |

#### Import (Buy from Foreign Supplier) - Self-Billing

| Field | Value |
|-------|-------|
| Document Type | `11` (Self-Billed Invoice) |
| Supplier TIN | `EI00000000030` (foreign supplier) |
| Buyer TIN | Your company TIN |
| Classification | Self-billed - Foreign Supplier |
| Deadline | End of month following customs clearance |

### 10.2 Intercompany Transactions

- E-Invoice **IS required** for intercompany charges
- Both entities must have separate TINs
- Standard invoice flow applies

### 10.3 Director Fees

- If Director has **contract for service**: Director issues e-Invoice
- If Director is **employee**: Not required (employment income exempt)

### 10.4 Deposits & Advances

| Type | E-Invoice Required? |
|------|---------------------|
| Refundable deposit | No |
| Non-refundable deposit | **Yes** |
| Advance payment | **Yes** (issue on receipt) |

### 10.5 Exemptions (No E-Invoice Required)

- Employment income
- Pension
- Alimony
- Zakat
- Securities trading (contract value)
- Certain dividend distributions
- Share disposals (with conditions)
- Donations received (specific types)

---

## 11. Database Schema Reference

### 11.1 Core Tables

```sql
-- Main E-Invoice Documents Table
CREATE TABLE einvoice_documents (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Internal Reference
    internal_reference          VARCHAR(50) NOT NULL,
    
    -- IRBM References
    irbm_uuid                   VARCHAR(50) UNIQUE,
    irbm_long_id                VARCHAR(200),
    submission_uid              VARCHAR(50),
    
    -- Document Type & Version
    document_type               VARCHAR(2) NOT NULL,  -- 01, 02, 03, 04, 11, 12, 13, 14
    document_version            VARCHAR(5) NOT NULL DEFAULT '1.1',
    
    -- Status
    status                      VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    -- DRAFT, PENDING, SUBMITTED, VALID, INVALID, CANCELLED, REJECTED
    
    -- Supplier Information
    supplier_tin                VARCHAR(20) NOT NULL,
    supplier_brn                VARCHAR(20),
    supplier_name               VARCHAR(300) NOT NULL,
    supplier_sst_no             VARCHAR(17),
    supplier_tourism_tax_no     VARCHAR(17),
    supplier_msic_code          VARCHAR(5) NOT NULL,
    supplier_business_activity  VARCHAR(300) NOT NULL,
    supplier_email              VARCHAR(320),
    supplier_phone              VARCHAR(20) NOT NULL,
    supplier_address_line1      VARCHAR(150) NOT NULL,
    supplier_address_line2      VARCHAR(150),
    supplier_address_line3      VARCHAR(150),
    supplier_postal_code        VARCHAR(10),
    supplier_city               VARCHAR(100) NOT NULL,
    supplier_state              VARCHAR(2) NOT NULL,
    supplier_country            VARCHAR(3) NOT NULL DEFAULT 'MYS',
    
    -- Buyer Information
    buyer_tin                   VARCHAR(20) NOT NULL,
    buyer_brn                   VARCHAR(20),
    buyer_name                  VARCHAR(300) NOT NULL,
    buyer_sst_no                VARCHAR(17),
    buyer_email                 VARCHAR(320),
    buyer_phone                 VARCHAR(20) NOT NULL,
    buyer_address_line1         VARCHAR(150) NOT NULL,
    buyer_address_line2         VARCHAR(150),
    buyer_address_line3         VARCHAR(150),
    buyer_postal_code           VARCHAR(10),
    buyer_city                  VARCHAR(100) NOT NULL,
    buyer_state                 VARCHAR(2) NOT NULL,
    buyer_country               VARCHAR(3) NOT NULL DEFAULT 'MYS',
    
    -- Financial Information
    currency_code               VARCHAR(3) NOT NULL DEFAULT 'MYR',
    exchange_rate               DECIMAL(18,6) DEFAULT 1.000000,
    total_excluding_tax         DECIMAL(18,2) NOT NULL,
    total_tax_amount            DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_including_tax         DECIMAL(18,2) NOT NULL,
    total_discount              DECIMAL(18,2) DEFAULT 0,
    total_charges               DECIMAL(18,2) DEFAULT 0,
    total_payable               DECIMAL(18,2) NOT NULL,
    rounding_amount             DECIMAL(18,2) DEFAULT 0,
    prepayment_amount           DECIMAL(18,2) DEFAULT 0,
    
    -- Reference (for CN/DN/Refund)
    original_invoice_uuid       VARCHAR(50),
    original_invoice_ref        VARCHAR(50),
    
    -- Payment Information
    payment_mode                VARCHAR(30),
    bank_account_number         VARCHAR(150),
    payment_terms               VARCHAR(500),
    
    -- Billing Period
    billing_frequency           VARCHAR(50),
    billing_period_start        DATE,
    billing_period_end          DATE,
    
    -- Timestamps
    issue_datetime              TIMESTAMP NOT NULL,
    submission_datetime         TIMESTAMP,
    validation_datetime         TIMESTAMP,
    cancellation_deadline       TIMESTAMP,
    cancelled_datetime          TIMESTAMP,
    
    -- Signature
    digital_signature           TEXT,
    document_hash               VARCHAR(100),
    
    -- Raw Data Storage
    raw_json                    JSONB,
    raw_xml                     TEXT,
    
    -- Audit
    created_by                  VARCHAR(100),
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by                  VARCHAR(100),
    updated_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Line Items Table
CREATE TABLE einvoice_line_items (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id                 UUID NOT NULL REFERENCES einvoice_documents(id),
    line_number                 INTEGER NOT NULL,
    
    -- Product/Service Details
    classification_code         VARCHAR(20) NOT NULL,
    description                 VARCHAR(500) NOT NULL,
    
    -- Quantity & Unit
    quantity                    DECIMAL(18,4),
    unit_of_measure             VARCHAR(20),
    
    -- Pricing
    unit_price                  DECIMAL(18,4) NOT NULL,
    
    -- Tax
    tax_type                    VARCHAR(10) NOT NULL,
    tax_rate                    DECIMAL(5,2),
    tax_amount                  DECIMAL(18,2) NOT NULL,
    tax_exemption_details       VARCHAR(500),
    tax_exemption_amount        DECIMAL(18,2),
    
    -- Discount
    discount_rate               DECIMAL(5,2),
    discount_amount             DECIMAL(18,2),
    
    -- Charges
    charge_rate                 DECIMAL(5,2),
    charge_amount               DECIMAL(18,2),
    
    -- Totals
    subtotal                    DECIMAL(18,2) NOT NULL,
    total_excluding_tax         DECIMAL(18,2) NOT NULL,
    
    -- Audit
    created_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(document_id, line_number)
);

-- API Submission Log
CREATE TABLE einvoice_api_logs (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id                 UUID REFERENCES einvoice_documents(id),
    
    -- API Details
    api_endpoint                VARCHAR(200) NOT NULL,
    http_method                 VARCHAR(10) NOT NULL,
    
    -- Request
    request_headers             JSONB,
    request_body                TEXT,
    
    -- Response
    http_status_code            INTEGER,
    response_headers            JSONB,
    response_body               TEXT,
    
    -- Timing
    request_datetime            TIMESTAMP NOT NULL,
    response_datetime           TIMESTAMP,
    duration_ms                 INTEGER,
    
    -- Status
    success                     BOOLEAN,
    error_code                  VARCHAR(50),
    error_message               TEXT
);

-- Status History
CREATE TABLE einvoice_status_history (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id                 UUID NOT NULL REFERENCES einvoice_documents(id),
    
    previous_status             VARCHAR(20),
    new_status                  VARCHAR(20) NOT NULL,
    
    reason                      TEXT,
    changed_by                  VARCHAR(100),
    changed_at                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master Data: Tax Types
CREATE TABLE einvoice_tax_types (
    code                        VARCHAR(10) PRIMARY KEY,
    description                 VARCHAR(100) NOT NULL,
    default_rate                DECIMAL(5,2),
    is_active                   BOOLEAN DEFAULT TRUE
);

-- Master Data: Classification Codes
CREATE TABLE einvoice_classifications (
    code                        VARCHAR(20) PRIMARY KEY,
    description                 VARCHAR(200) NOT NULL,
    category                    VARCHAR(50),
    is_self_billed              BOOLEAN DEFAULT FALSE,
    is_active                   BOOLEAN DEFAULT TRUE
);

-- Master Data: State Codes
CREATE TABLE einvoice_states (
    code                        VARCHAR(2) PRIMARY KEY,
    name                        VARCHAR(100) NOT NULL,
    country_code                VARCHAR(3) DEFAULT 'MYS'
);

-- Indexes for Performance
CREATE INDEX idx_einvoice_docs_status ON einvoice_documents(status);
CREATE INDEX idx_einvoice_docs_supplier_tin ON einvoice_documents(supplier_tin);
CREATE INDEX idx_einvoice_docs_buyer_tin ON einvoice_documents(buyer_tin);
CREATE INDEX idx_einvoice_docs_issue_date ON einvoice_documents(issue_datetime);
CREATE INDEX idx_einvoice_docs_irbm_uuid ON einvoice_documents(irbm_uuid);
CREATE INDEX idx_einvoice_docs_internal_ref ON einvoice_documents(internal_reference);
CREATE INDEX idx_einvoice_lines_doc_id ON einvoice_line_items(document_id);
CREATE INDEX idx_einvoice_logs_doc_id ON einvoice_api_logs(document_id);
```

### 11.2 Seed Data

```sql
-- Tax Types
INSERT INTO einvoice_tax_types (code, description, default_rate) VALUES
('01', 'Sales Tax', 10.00),
('02', 'Service Tax', 6.00),
('03', 'Tourism Tax', 0.00),
('04', 'High-Value Goods Tax', 10.00),
('05', 'Sales Tax on Low Value Goods', 10.00),
('06', 'Not Applicable', 0.00),
('E', 'Tax Exempt', 0.00);

-- State Codes
INSERT INTO einvoice_states (code, name) VALUES
('01', 'Johor'),
('02', 'Kedah'),
('03', 'Kelantan'),
('04', 'Melaka'),
('05', 'Negeri Sembilan'),
('06', 'Pahang'),
('07', 'Pulau Pinang'),
('08', 'Perak'),
('09', 'Perlis'),
('10', 'Selangor'),
('11', 'Terengganu'),
('12', 'Sabah'),
('13', 'Sarawak'),
('14', 'Wilayah Persekutuan Kuala Lumpur'),
('15', 'Wilayah Persekutuan Labuan'),
('16', 'Wilayah Persekutuan Putrajaya'),
('17', 'Not Applicable');
```

---

## 12. Code Examples

### 12.1 UBL 2.1 JSON Invoice Structure

```json
{
  "_D": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
  "_A": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
  "_B": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
  "Invoice": [
    {
      "ID": [{ "_": "INV-2025-00001" }],
      "IssueDate": [{ "_": "2025-01-15" }],
      "IssueTime": [{ "_": "10:30:00Z" }],
      "InvoiceTypeCode": [{ "_": "01", "listVersionID": "1.1" }],
      "DocumentCurrencyCode": [{ "_": "MYR" }],
      "InvoicePeriod": [
        {
          "StartDate": [{ "_": "2025-01-01" }],
          "EndDate": [{ "_": "2025-01-31" }],
          "Description": [{ "_": "Monthly" }]
        }
      ],
      "BillingReference": [
        {
          "AdditionalDocumentReference": [
            {
              "ID": [{ "_": "E12345678912345678901234567890123456789012345678" }]
            }
          ]
        }
      ],
      "AccountingSupplierParty": [
        {
          "Party": [
            {
              "IndustryClassificationCode": [{ "_": "46510", "name": "Wholesale of computers" }],
              "PartyIdentification": [
                { "ID": [{ "_": "C1234567890", "schemeID": "TIN" }] },
                { "ID": [{ "_": "202001012345", "schemeID": "BRN" }] },
                { "ID": [{ "_": "A12-3456-78901234", "schemeID": "SST" }] }
              ],
              "PostalAddress": [
                {
                  "CityName": [{ "_": "Kuala Lumpur" }],
                  "PostalZone": [{ "_": "50000" }],
                  "CountrySubentityCode": [{ "_": "14" }],
                  "AddressLine": [
                    { "Line": [{ "_": "No. 123, Jalan ABC" }] },
                    { "Line": [{ "_": "Taman XYZ" }] },
                    { "Line": [{ "_": "" }] }
                  ],
                  "Country": [
                    { "IdentificationCode": [{ "_": "MYS", "listID": "ISO3166-1", "listAgencyID": "6" }] }
                  ]
                }
              ],
              "PartyLegalEntity": [
                { "RegistrationName": [{ "_": "Supplier Company Sdn Bhd" }] }
              ],
              "Contact": [
                {
                  "Telephone": [{ "_": "+60123456789" }],
                  "ElectronicMail": [{ "_": "supplier@example.com" }]
                }
              ]
            }
          ]
        }
      ],
      "AccountingCustomerParty": [
        {
          "Party": [
            {
              "PartyIdentification": [
                { "ID": [{ "_": "C0987654321", "schemeID": "TIN" }] },
                { "ID": [{ "_": "202001054321", "schemeID": "BRN" }] },
                { "ID": [{ "_": "B12-3456-78901234", "schemeID": "SST" }] }
              ],
              "PostalAddress": [
                {
                  "CityName": [{ "_": "Petaling Jaya" }],
                  "PostalZone": [{ "_": "47301" }],
                  "CountrySubentityCode": [{ "_": "10" }],
                  "AddressLine": [
                    { "Line": [{ "_": "No. 456, Jalan DEF" }] },
                    { "Line": [{ "_": "SS2" }] },
                    { "Line": [{ "_": "" }] }
                  ],
                  "Country": [
                    { "IdentificationCode": [{ "_": "MYS", "listID": "ISO3166-1", "listAgencyID": "6" }] }
                  ]
                }
              ],
              "PartyLegalEntity": [
                { "RegistrationName": [{ "_": "Buyer Company Sdn Bhd" }] }
              ],
              "Contact": [
                {
                  "Telephone": [{ "_": "+60198765432" }],
                  "ElectronicMail": [{ "_": "buyer@example.com" }]
                }
              ]
            }
          ]
        }
      ],
      "PaymentMeans": [
        {
          "PaymentMeansCode": [{ "_": "03" }],
          "PayeeFinancialAccount": [
            { "ID": [{ "_": "1234567890" }] }
          ]
        }
      ],
      "PaymentTerms": [
        {
          "Note": [{ "_": "Payment due within 30 days" }]
        }
      ],
      "PrepaidPayment": [
        {
          "ID": [{ "_": "PREPAY-001" }],
          "PaidAmount": [{ "_": 500.00, "currencyID": "MYR" }],
          "PaidDate": [{ "_": "2025-01-10" }]
        }
      ],
      "TaxTotal": [
        {
          "TaxAmount": [{ "_": 60.00, "currencyID": "MYR" }],
          "TaxSubtotal": [
            {
              "TaxableAmount": [{ "_": 1000.00, "currencyID": "MYR" }],
              "TaxAmount": [{ "_": 60.00, "currencyID": "MYR" }],
              "TaxCategory": [
                {
                  "ID": [{ "_": "02" }],
                  "Percent": [{ "_": 6.00 }],
                  "TaxScheme": [
                    {
                      "ID": [{ "_": "OTH", "schemeID": "UN/ECE 5153", "schemeAgencyID": "6" }]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      "LegalMonetaryTotal": [
        {
          "LineExtensionAmount": [{ "_": 1000.00, "currencyID": "MYR" }],
          "TaxExclusiveAmount": [{ "_": 1000.00, "currencyID": "MYR" }],
          "TaxInclusiveAmount": [{ "_": 1060.00, "currencyID": "MYR" }],
          "AllowanceTotalAmount": [{ "_": 0.00, "currencyID": "MYR" }],
          "ChargeTotalAmount": [{ "_": 0.00, "currencyID": "MYR" }],
          "PrepaidAmount": [{ "_": 500.00, "currencyID": "MYR" }],
          "PayableRoundingAmount": [{ "_": 0.00, "currencyID": "MYR" }],
          "PayableAmount": [{ "_": 560.00, "currencyID": "MYR" }]
        }
      ],
      "InvoiceLine": [
        {
          "ID": [{ "_": "1" }],
          "InvoicedQuantity": [{ "_": 10, "unitCode": "EA" }],
          "LineExtensionAmount": [{ "_": 1000.00, "currencyID": "MYR" }],
          "TaxTotal": [
            {
              "TaxAmount": [{ "_": 60.00, "currencyID": "MYR" }],
              "TaxSubtotal": [
                {
                  "TaxableAmount": [{ "_": 1000.00, "currencyID": "MYR" }],
                  "TaxAmount": [{ "_": 60.00, "currencyID": "MYR" }],
                  "Percent": [{ "_": 6.00 }],
                  "TaxCategory": [
                    {
                      "ID": [{ "_": "02" }],
                      "TaxScheme": [
                        { "ID": [{ "_": "OTH", "schemeID": "UN/ECE 5153", "schemeAgencyID": "6" }] }
                      ]
                    }
                  ]
                }
              ]
            }
          ],
          "Item": [
            {
              "CommodityClassification": [
                { "ItemClassificationCode": [{ "_": "001", "listID": "CLASS" }] }
              ],
              "Description": [{ "_": "Computer Equipment - Laptop Model XYZ" }]
            }
          ],
          "Price": [
            {
              "PriceAmount": [{ "_": 100.00, "currencyID": "MYR" }]
            }
          ],
          "ItemPriceExtension": [
            {
              "Amount": [{ "_": 1000.00, "currencyID": "MYR" }]
            }
          ]
        }
      ],
      "UBLExtensions": [
        {
          "UBLExtension": [
            {
              "ExtensionURI": [{ "_": "urn:oasis:names:specification:ubl:dsig:enveloped:xades" }],
              "ExtensionContent": [
                {
                  "UBLDocumentSignatures": [
                    {
                      "SignatureInformation": [
                        {
                          "ID": [{ "_": "urn:oasis:names:specification:ubl:signature:1" }],
                          "ReferencedSignatureID": [{ "_": "urn:oasis:names:specification:ubl:signature:Invoice" }],
                          "Signature": {
                            "Id": "signature",
                            "Object": [
                              {
                                "QualifyingProperties": {
                                  "Target": "signature",
                                  "SignedProperties": {
                                    "Id": "id-xades-signed-props",
                                    "SignedSignatureProperties": {
                                      "SigningTime": "2025-01-15T10:30:00Z",
                                      "SigningCertificate": {
                                        "Cert": {
                                          "CertDigest": {
                                            "DigestMethod": { "Algorithm": "http://www.w3.org/2001/04/xmlenc#sha256" },
                                            "DigestValue": "CERTIFICATE_DIGEST_BASE64"
                                          },
                                          "IssuerSerial": {
                                            "X509IssuerName": "CN=Certificate Authority",
                                            "X509SerialNumber": "123456789"
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            ],
                            "KeyInfo": {
                              "X509Data": {
                                "X509Certificate": "CERTIFICATE_BASE64",
                                "X509SubjectName": "CN=Supplier Company",
                                "X509IssuerSerial": {
                                  "X509IssuerName": "CN=Certificate Authority",
                                  "X509SerialNumber": "123456789"
                                }
                              }
                            },
                            "SignatureValue": "SIGNATURE_VALUE_BASE64",
                            "SignedInfo": {
                              "SignatureMethod": { "Algorithm": "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" },
                              "Reference": [
                                {
                                  "DigestMethod": { "Algorithm": "http://www.w3.org/2001/04/xmlenc#sha256" },
                                  "DigestValue": "DOCUMENT_DIGEST_BASE64",
                                  "Id": "id-doc-signed-data",
                                  "URI": ""
                                },
                                {
                                  "Type": "http://uri.etsi.org/01903/v1.3.2#SignedProperties",
                                  "DigestMethod": { "Algorithm": "http://www.w3.org/2001/04/xmlenc#sha256" },
                                  "DigestValue": "PROPS_DIGEST_BASE64",
                                  "URI": "#id-xades-signed-props"
                                }
                              ]
                            }
                          }
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### 12.2 API Integration Example (Node.js/TypeScript)

```typescript
// myinvois-client.ts

import crypto from 'crypto';
import axios, { AxiosInstance } from 'axios';

interface MyInvoisConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'production';
  certificatePath?: string;
  certificatePassword?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface SubmitDocumentRequest {
  documents: Array<{
    format: 'JSON' | 'XML';
    documentHash: string;
    codeNumber: string;
    document: string;
  }>;
}

interface SubmitDocumentResponse {
  submissionUid: string;
  acceptedDocuments: Array<{
    uuid: string;
    invoiceCodeNumber: string;
    longId: string;
  }>;
  rejectedDocuments: Array<{
    invoiceCodeNumber: string;
    error: {
      code: string;
      message: string;
      propertyPath?: string;
    };
  }>;
}

class MyInvoisClient {
  private config: MyInvoisConfig;
  private httpClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(config: MyInvoisConfig) {
    this.config = config;
    
    const baseURL = config.environment === 'production'
      ? 'https://api.myinvois.hasil.gov.my'
      : 'https://preprod-api.myinvois.hasil.gov.my';
    
    this.httpClient = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Language': 'en'
      }
    });
  }

  // Authentication
  async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    const response = await this.httpClient.post<TokenResponse>(
      '/connect/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: 'InvoicingAPI'
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    this.accessToken = response.data.access_token;
    this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 60) * 1000);
    
    return this.accessToken;
  }

  // Calculate document hash
  calculateDocumentHash(document: object): string {
    const jsonString = JSON.stringify(document);
    const hash = crypto.createHash('sha256').update(jsonString).digest('base64');
    return hash;
  }

  // Validate TIN
  async validateTIN(tin: string, idType: string, idValue: string): Promise<boolean> {
    const token = await this.getAccessToken();
    
    try {
      await this.httpClient.get(
        `/api/v1.0/taxpayer/validate/${tin}`,
        {
          params: { idType, idValue },
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  // Submit documents
  async submitDocuments(documents: Array<{
    codeNumber: string;
    document: object;
  }>): Promise<SubmitDocumentResponse> {
    const token = await this.getAccessToken();
    
    const request: SubmitDocumentRequest = {
      documents: documents.map(doc => ({
        format: 'JSON',
        documentHash: this.calculateDocumentHash(doc.document),
        codeNumber: doc.codeNumber,
        document: Buffer.from(JSON.stringify(doc.document)).toString('base64')
      }))
    };

    const response = await this.httpClient.post<SubmitDocumentResponse>(
      '/api/v1.0/documentsubmissions',
      request,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;
  }

  // Cancel document
  async cancelDocument(uuid: string, reason: string): Promise<void> {
    const token = await this.getAccessToken();
    
    await this.httpClient.put(
      `/api/v1.0/documents/state/${uuid}/state`,
      { status: 'cancelled', reason },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );
  }

  // Get document
  async getDocument(uuid: string): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await this.httpClient.get(
      `/api/v1.0/documents/${uuid}/raw`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;
  }

  // Get recent documents
  async getRecentDocuments(params: {
    pageNo?: number;
    pageSize?: number;
    status?: string;
    direction?: 'Sent' | 'Received';
  } = {}): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await this.httpClient.get(
      '/api/v1.0/documents/recent',
      {
        params,
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;
  }

  // Search taxpayer TIN
  async searchTaxpayer(params: {
    taxpayerName?: string;
    idType?: string;
    idValue?: string;
  }): Promise<any> {
    const token = await this.getAccessToken();
    
    const response = await this.httpClient.get(
      '/api/v1.0/taxpayer',
      {
        params,
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;
  }
}

export default MyInvoisClient;
```

### 12.3 Invoice Builder Example

```typescript
// invoice-builder.ts

interface InvoiceLineItem {
  lineNumber: number;
  classificationCode: string;
  description: string;
  quantity?: number;
  unitOfMeasure?: string;
  unitPrice: number;
  taxType: string;
  taxRate: number;
  discountRate?: number;
  discountAmount?: number;
}

interface InvoiceParty {
  tin: string;
  brn?: string;
  sstNo?: string;
  name: string;
  email?: string;
  phone: string;
  address: {
    line1: string;
    line2?: string;
    line3?: string;
    postalCode: string;
    city: string;
    state: string;
    country: string;
  };
  msicCode?: string;
  businessActivity?: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceType: '01' | '02' | '03' | '04' | '11' | '12' | '13' | '14';
  issueDateTime: Date;
  currencyCode: string;
  exchangeRate?: number;
  supplier: InvoiceParty;
  buyer: InvoiceParty;
  lineItems: InvoiceLineItem[];
  originalInvoiceUUID?: string;
  paymentMode?: string;
  bankAccountNumber?: string;
  paymentTerms?: string;
  prepaymentAmount?: number;
  prepaymentDate?: Date;
}

class InvoiceBuilder {
  
  buildUBLInvoice(data: InvoiceData): object {
    // Calculate totals
    let totalExcludingTax = 0;
    let totalTax = 0;
    
    const invoiceLines = data.lineItems.map(item => {
      const quantity = item.quantity || 1;
      const lineAmount = item.unitPrice * quantity;
      const discount = item.discountAmount || (item.discountRate ? lineAmount * item.discountRate / 100 : 0);
      const taxableAmount = lineAmount - discount;
      const taxAmount = taxableAmount * item.taxRate / 100;
      
      totalExcludingTax += taxableAmount;
      totalTax += taxAmount;
      
      return this.buildInvoiceLine(item, taxableAmount, taxAmount);
    });

    const totalIncludingTax = totalExcludingTax + totalTax;
    const prepayment = data.prepaymentAmount || 0;
    const payableAmount = totalIncludingTax - prepayment;

    return {
      "_D": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
      "_A": "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
      "_B": "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
      "Invoice": [{
        "ID": [{ "_": data.invoiceNumber }],
        "IssueDate": [{ "_": this.formatDate(data.issueDateTime) }],
        "IssueTime": [{ "_": this.formatTime(data.issueDateTime) }],
        "InvoiceTypeCode": [{ "_": data.invoiceType, "listVersionID": "1.1" }],
        "DocumentCurrencyCode": [{ "_": data.currencyCode }],
        ...(data.exchangeRate && {
          "TaxExchangeRate": [{
            "CalculationRate": [{ "_": data.exchangeRate }],
            "SourceCurrencyCode": [{ "_": data.currencyCode }],
            "TargetCurrencyCode": [{ "_": "MYR" }]
          }]
        }),
        ...(data.originalInvoiceUUID && {
          "BillingReference": [{
            "AdditionalDocumentReference": [{
              "ID": [{ "_": data.originalInvoiceUUID }]
            }]
          }]
        }),
        "AccountingSupplierParty": [this.buildParty(data.supplier, true)],
        "AccountingCustomerParty": [this.buildParty(data.buyer, false)],
        ...(data.paymentMode && {
          "PaymentMeans": [{
            "PaymentMeansCode": [{ "_": data.paymentMode }],
            ...(data.bankAccountNumber && {
              "PayeeFinancialAccount": [{
                "ID": [{ "_": data.bankAccountNumber }]
              }]
            })
          }]
        }),
        ...(data.paymentTerms && {
          "PaymentTerms": [{
            "Note": [{ "_": data.paymentTerms }]
          }]
        }),
        ...(data.prepaymentAmount && {
          "PrepaidPayment": [{
            "PaidAmount": [{ "_": data.prepaymentAmount, "currencyID": data.currencyCode }],
            ...(data.prepaymentDate && {
              "PaidDate": [{ "_": this.formatDate(data.prepaymentDate) }]
            })
          }]
        }),
        "TaxTotal": [this.buildTaxTotal(totalTax, totalExcludingTax, data.currencyCode)],
        "LegalMonetaryTotal": [{
          "LineExtensionAmount": [{ "_": totalExcludingTax, "currencyID": data.currencyCode }],
          "TaxExclusiveAmount": [{ "_": totalExcludingTax, "currencyID": data.currencyCode }],
          "TaxInclusiveAmount": [{ "_": totalIncludingTax, "currencyID": data.currencyCode }],
          "PrepaidAmount": [{ "_": prepayment, "currencyID": data.currencyCode }],
          "PayableAmount": [{ "_": payableAmount, "currencyID": data.currencyCode }]
        }],
        "InvoiceLine": invoiceLines
      }]
    };
  }

  private buildParty(party: InvoiceParty, isSupplier: boolean): object {
    const identifications = [
      { "ID": [{ "_": party.tin, "schemeID": "TIN" }] }
    ];
    
    if (party.brn) {
      identifications.push({ "ID": [{ "_": party.brn, "schemeID": "BRN" }] });
    }
    
    if (party.sstNo) {
      identifications.push({ "ID": [{ "_": party.sstNo, "schemeID": "SST" }] });
    }

    return {
      "Party": [{
        ...(isSupplier && party.msicCode && {
          "IndustryClassificationCode": [{ 
            "_": party.msicCode, 
            "name": party.businessActivity || "" 
          }]
        }),
        "PartyIdentification": identifications,
        "PostalAddress": [{
          "CityName": [{ "_": party.address.city }],
          "PostalZone": [{ "_": party.address.postalCode }],
          "CountrySubentityCode": [{ "_": party.address.state }],
          "AddressLine": [
            { "Line": [{ "_": party.address.line1 }] },
            { "Line": [{ "_": party.address.line2 || "" }] },
            { "Line": [{ "_": party.address.line3 || "" }] }
          ],
          "Country": [{
            "IdentificationCode": [{ 
              "_": party.address.country, 
              "listID": "ISO3166-1", 
              "listAgencyID": "6" 
            }]
          }]
        }],
        "PartyLegalEntity": [{
          "RegistrationName": [{ "_": party.name }]
        }],
        "Contact": [{
          "Telephone": [{ "_": party.phone }],
          ...(party.email && { "ElectronicMail": [{ "_": party.email }] })
        }]
      }]
    };
  }

  private buildInvoiceLine(item: InvoiceLineItem, taxableAmount: number, taxAmount: number): object {
    return {
      "ID": [{ "_": item.lineNumber.toString() }],
      ...(item.quantity && {
        "InvoicedQuantity": [{ "_": item.quantity, "unitCode": item.unitOfMeasure || "EA" }]
      }),
      "LineExtensionAmount": [{ "_": taxableAmount, "currencyID": "MYR" }],
      "TaxTotal": [{
        "TaxAmount": [{ "_": taxAmount, "currencyID": "MYR" }],
        "TaxSubtotal": [{
          "TaxableAmount": [{ "_": taxableAmount, "currencyID": "MYR" }],
          "TaxAmount": [{ "_": taxAmount, "currencyID": "MYR" }],
          "Percent": [{ "_": item.taxRate }],
          "TaxCategory": [{
            "ID": [{ "_": item.taxType }],
            "TaxScheme": [{
              "ID": [{ "_": "OTH", "schemeID": "UN/ECE 5153", "schemeAgencyID": "6" }]
            }]
          }]
        }]
      }],
      "Item": [{
        "CommodityClassification": [{
          "ItemClassificationCode": [{ "_": item.classificationCode, "listID": "CLASS" }]
        }],
        "Description": [{ "_": item.description }]
      }],
      "Price": [{
        "PriceAmount": [{ "_": item.unitPrice, "currencyID": "MYR" }]
      }],
      "ItemPriceExtension": [{
        "Amount": [{ "_": taxableAmount, "currencyID": "MYR" }]
      }]
    };
  }

  private buildTaxTotal(totalTax: number, totalTaxable: number, currency: string): object {
    return {
      "TaxAmount": [{ "_": totalTax, "currencyID": currency }],
      "TaxSubtotal": [{
        "TaxableAmount": [{ "_": totalTaxable, "currencyID": currency }],
        "TaxAmount": [{ "_": totalTax, "currencyID": currency }],
        "TaxCategory": [{
          "ID": [{ "_": "02" }],
          "TaxScheme": [{
            "ID": [{ "_": "OTH", "schemeID": "UN/ECE 5153", "schemeAgencyID": "6" }]
          }]
        }]
      }]
    };
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private formatTime(date: Date): string {
    return date.toISOString().split('T')[1].replace(/\.\d{3}/, '');
  }
}

export { InvoiceBuilder, InvoiceData, InvoiceLineItem, InvoiceParty };
```

---

## 13. Implementation Checklist

### 13.1 Pre-Implementation

- [ ] Register company on MyTax Portal (https://mytax.hasil.gov.my)
- [ ] Obtain TIN for company and verify format
- [ ] Register ERP system in MyInvois Portal to get Client ID & Secret
- [ ] Procure digital certificate from MCMC-licensed CA
- [ ] Review LHDN SDK documentation (https://sdk.myinvois.hasil.gov.my)
- [ ] Identify implementation phase based on company revenue

### 13.2 Data Setup

- [ ] Update supplier master data (TIN, BRN, MSIC code, address)
- [ ] Update customer master data (TIN, BRN, address)
- [ ] Setup tax types and rates
- [ ] Setup classification codes
- [ ] Setup state codes lookup table
- [ ] Configure general TIN for special scenarios

### 13.3 Core Development

- [ ] Implement OAuth 2.0 authentication module
- [ ] Implement TIN validation API integration
- [ ] Build UBL 2.1 JSON/XML document generator
- [ ] Implement digital signature module
- [ ] Implement document hash calculation
- [ ] Build Submit Documents API integration
- [ ] Build Cancel Document API integration
- [ ] Build Get Document APIs integration
- [ ] Implement 72-hour cancellation window tracker

### 13.4 Document Types

- [ ] Standard Invoice (Type 01)
- [ ] Credit Note (Type 02)
- [ ] Debit Note (Type 03)
- [ ] Refund Note (Type 04)
- [ ] Self-Billed Invoice (Type 11)
- [ ] Self-Billed Credit Note (Type 12)
- [ ] Self-Billed Debit Note (Type 13)
- [ ] Self-Billed Refund Note (Type 14)

### 13.5 Business Flows

- [ ] B2B invoice flow
- [ ] B2C individual invoice flow
- [ ] Consolidated invoice flow (monthly aggregation)
- [ ] Export invoice flow
- [ ] Import self-billing flow
- [ ] Invoice adjustment flows (CN/DN/Refund)
- [ ] Intercompany invoice flow

### 13.6 Error Handling & Logging

- [ ] API error handling with retry logic
- [ ] Validation error display and correction workflow
- [ ] API request/response logging
- [ ] Status change audit trail

### 13.7 User Interface

- [ ] E-Invoice status dashboard
- [ ] Document submission interface
- [ ] 72-hour countdown display
- [ ] QR code generation and display
- [ ] PDF visual representation
- [ ] Error message display and resolution guide

### 13.8 Testing

- [ ] Sandbox environment testing
- [ ] All document types submission test
- [ ] Cancellation/rejection flow test
- [ ] Error scenario handling test
- [ ] Performance/load testing

### 13.9 Go-Live

- [ ] Switch to production environment
- [ ] Production credentials configuration
- [ ] Monitoring and alerting setup
- [ ] User training completion
- [ ] Support documentation ready

---

## Quick Reference Card

### API Base URLs
| Environment | URL |
|-------------|-----|
| Sandbox | `https://preprod-api.myinvois.hasil.gov.my` |
| Production | `https://api.myinvois.hasil.gov.my` |

### Key Endpoints
| Action | Method | Endpoint |
|--------|--------|----------|
| Get Token | POST | `/connect/token` |
| Validate TIN | GET | `/api/v1.0/taxpayer/validate/{tin}` |
| Submit Docs | POST | `/api/v1.0/documentsubmissions` |
| Cancel Doc | PUT | `/api/v1.0/documents/state/{uuid}/state` |
| Get Document | GET | `/api/v1.0/documents/{uuid}/raw` |

### Document Type Codes
| Code | Type |
|------|------|
| 01 | Invoice |
| 02 | Credit Note |
| 03 | Debit Note |
| 04 | Refund Note |
| 11 | Self-Billed Invoice |
| 12 | Self-Billed Credit Note |
| 13 | Self-Billed Debit Note |
| 14 | Self-Billed Refund Note |

### Special TINs
| TIN | Use For |
|-----|---------|
| EI00000000010 | MY individual without TIN |
| EI00000000020 | Foreign buyer without TIN |
| EI00000000030 | Foreign supplier (self-billing) |

### Critical Timelines
| Event | Deadline |
|-------|----------|
| Cancellation Window | 72 hours from validation |
| Consolidated Invoice | 7 days after month end |
| Self-Billed (Import) | End of month following customs clearance |

---

**Document Version**: 1.0  
**Last Updated**: December 2025  
**Source**: LHDN E-Invoice Guideline v4.6 & MyInvois SDK

---

*This document is intended for AI agents and developers implementing Malaysia E-Invoice functionality. Always refer to the official LHDN documentation for the most current requirements.*