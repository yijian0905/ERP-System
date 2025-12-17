# 📘 ERP System Specification

> Version: 1.2.0
> 
> **Last Updated**: December 2025
> 
> **Purpose**: Single source of truth for developing, packaging, and operating the ERP platform delivered as a Desktop-first system with license-driven capabilities and Enterprise AI extensibility.

---

## 📋 Project Overview

A **commercial-grade, multi-tenant ERP platform** delivered primarily as a **Desktop Application (Electron)**, with a shared Web build for development and optional browser access.

The product is monetized via **License Keys**, which resolve into **capabilities** (not hard-coded tiers). Advanced capabilities include **Forecasting** and **Enterprise AI (chat today, agent-ready architecture)**.

### Key Characteristics

| Aspect | Description |
| --- | --- |
| Architecture | Multi-tenant (tenantId-scoped queries; optional RLS) |
| Distribution | Desktop (Electron) + Web (shared build) |
| Licensing | License Key activation → persisted **License Context** |
| Feature Access | **Capability-based** gating (server authoritative) |
| Auth | Policy-based (Password / SSO / MFA) |
| Branding | Tenant-level **logo supported for all tiers** |
| AI | Enterprise AI chat; agent-ready authorization & audit |
| Printing | Application-controlled preview + silent print |

---

## 🛠️ Technology Stack

### Frontend (`apps/web`)

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: TanStack Router
- **State**: Zustand
- **Data Fetching**: TanStack Query
- **UI**: Tailwind + shadcn/ui

### Backend (`apps/api`)

- **Runtime**: Node.js + TypeScript
- **Framework**: Fastify
- **DB**: PostgreSQL + Prisma
- **Auth**: Session/JWT (policy-driven)

### Desktop (`apps/desktop`)

- **Runtime**: **Electron**
- **Packaging**: electron-builder
- **Auto Update**: electron-updater
- **IPC**: preload + contextBridge (whitelist only)
- **Local Storage**:
    - Encrypted License Context
    - OS Credential Store (tokens, if any)

### AI Services (`apps/ai-service`)

- **Runtime**: Python
- **Local Model**: Ollama
- **Scope**: Enterprise AI chat; agent-ready boundaries

---

## 🧾 Licensing & Capability Model

### Subscription Tiers (business-facing)

- **BASIC**: Core ERP
- **PRO**: BASIC + Forecasting
- **ENTERPRISE**: PRO + AI Chat (Agent-ready)

> Engineering MUST treat tiers as labels only.
> 
> 
> **All enforcement is via capabilities returned from the server.**

### Capability Model (authoritative)

Example capability codes:

- `erp_core`
- `forecasting`
- `ai_chat`
- `ai_agent` (default false)
- `automation_rules` (future)

**Rule**:

UI and API access MUST be gated by `capabilities[code]`, never by tier.

---

## 🎨 Branding (All Tiers)

### Requirements

- All subscription tiers MAY configure a tenant logo.
- Logo MUST appear in:
    - Desktop shell (top bar / splash)
    - Login UI
    - Application header
- Branding SHOULD be cached locally for immediate desktop startup.

### API (suggested)

- `GET /tenant/branding`
- `POST /tenant/branding/logo`
- `DELETE /tenant/branding/logo` (optional)

### Permissions

- Default: Tenant Admin only (configurable).

---

## 🔐 Authentication & Login (Policy-based)

### Auth Policy

Login UI MUST be rendered from `authPolicy`, not from tier.

Fields:

- `primary`: `password | sso`
- `allowPasswordFallback`: boolean
- `mfa`: `off | optional | required`
- `identifier`: `email | username`

### Login Flow

1. Render Login UI from cached `authPolicy`
2. Authenticate via Password or SSO
3. Complete MFA if required
4. Fetch `/auth/me` to hydrate:
    - `user`
    - `tenant`
    - `capabilities`
    - `branding`
5. Enter application shell

---

## 🖥️ Desktop Application Lifecycle (Electron)

### A. First-run Initialization (Required)

Triggered when no local License Context exists or user resets license.

**State Machine**

1. Welcome
2. Enter License Key (+ optional Server URL)
3. Activate License
4. Receive: `tenantId`, `authPolicy`, `capabilities`, `branding`
5. Optional: upload/set tenant logo
6. Persist encrypted License Context
7. Render Login UI

**Activation API**

- `POST /license/activate`

### B. Subsequent Startup

1. Load encrypted License Context
2. Apply cached branding immediately
3. Render Login UI
4. Login
5. Refresh capabilities & branding from server

---

## 🖨️ Invoice Printing & Preview System

### Scope

Applies to Invoice, Delivery Notes, Receipts, and all documents requiring high layout consistency.

---

### Core Design Principles

1. **Live Preview and Print Source MUST be separated**
   - What users see in Live Preview ≠ actual print source
2. **Print output MUST be fully controllable**
   - System MUST NOT rely on browser/OS print headers/footers
3. **Print behavior MUST be decoupled from UI state**
   - Print uses Data Snapshot only, not current UI structure

---

### Live Preview (即時預覽)

**Definition**: HTML-based dynamic preview where form inputs (left side) reflect immediately on preview (right side).

**Rules**:
- Live Preview is for visual confirmation and content proofing ONLY
- Live Preview MUST NOT be used directly as print source
- Preview may include UI padding, containers, scroll behavior
- Preview does NOT need precise print pagination

---

### Print Snapshot (列印資料快照)

**Definition**: Complete data snapshot captured when user triggers "Print".

**Content** (minimum):
- Invoice main data
- Line items
- Tax amounts, totals
- Company and customer info
- Print settings (paper size, orientation, printer)

**Rules**:
- Snapshot MUST be immutable during print flow
- Snapshot MUST NOT sync with form state once captured

---

### Print Layout (列印專用版面)

**Requirements**:
- Print MUST use a **dedicated print layout**
- Print layout should be visually similar to Live Preview but NOT 1:1 DOM structure

**Print Layout MUST**:
- Define exact paper size (e.g., A4)
- Control margins, spacing, and pagination
- Contain ONLY document content (no UI controls)
- Include system-defined headers/footers (company info, terms)

---

### Header/Footer Constraints (關鍵)

System MUST NOT use browser default print headers/footers.

All headers and footers MUST:
- Be designed by the system
- Be part of document layout

Print output MUST NOT contain:
- URL
- Auto-generated date/time (unless document requires)
- Browser name
- Page numbers (unless document requires)

---

### Print Execution Strategy

**Supported Modes**:
- Silent Print (requires target printer specification)
- Save to PDF (default option available)

**Rules**:
- Silent print failures MUST fallback to non-silent print flow
- Print failures MUST NOT cause data loss or system interruption

---

### Print Settings

**Required Settings**:
- Target printer (default: connected printer, with "Save to PDF" option)
- Paper size
- Orientation (Portrait / Landscape)
- Color mode (Color / B&W)
- Scale
- Copy count

**Storage**:
- Print settings stored locally (Workstation-level)
- Different devices may have different defaults

---

### Print Audit (Enterprise)

**Log the following** (at minimum):
- tenantId
- userId
- documentType
- documentId
- printTimestamp

---

### Anti-Patterns (明確不採用)

System MUST NOT:
- Print the Live Preview directly
- Rely on browser print preview UI
- Attempt to disable browser headers/footers via print settings
- Treat UI structure as print layout

---

### Specification Summary

| Principle | Requirement |
|-----------|-------------|
| Live Preview ≠ Print Output | ✅ Separated |
| PDF as print source | ✅ Required |
| Headers/Footers by system | ✅ Required |
| Cross-platform consistency | ✅ Required |


---

## 🧠 Enterprise AI (Chat now, Agent-ready)

### Principles

- AI MUST NOT initialize before login
- Agent actions require:
    1. Capability `ai_agent = true`
    2. Tenant enabled
    3. User role permitted
- All AI actions MUST be auditable

### Post-login Initialization

- `POST /ai/session/initialize`

Failure MUST NOT block ERP core usage.

---

## 🔒 Security Guidelines

1. Capability gating MUST be enforced server-side
2. Rate limit:
    - License activation
    - Login
    - MFA
3. Electron security baseline:
    - `contextIsolation: true`
    - `nodeIntegration: false`
4. Sensitive local data MUST be encrypted
5. All print, AI, and permission events SHOULD be audited

---

## 📂 Project Structure

```
apps/
  web/
  api/
  ai-service/
  desktop/        # Electron main / preload / updater
packages/
  shared/
docs/
```

---

## ⚠️ Common Pitfalls to Avoid

1. Hard-coding subscription tiers
2. Initializing AI before login
3. Treating Desktop as a simple webview
4. Relying on Electron print preview
5. Silent printing without preview or audit
6. Storing secrets unencrypted

---

## 📚 Related Docs

- `README.md`