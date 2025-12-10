# CLAUDE.md - AI Assistant Guide for ERP System

> **Version**: 1.0.0
> **Last Updated**: December 2025
> **Purpose**: Comprehensive guide for AI assistants working on this commercial-grade multi-tenant ERP system

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Codebase Structure](#codebase-structure)
3. [Technology Stack](#technology-stack)
4. [Architecture Patterns](#architecture-patterns)
5. [Development Workflow](#development-workflow)
6. [Code Conventions](#code-conventions)
7. [Key Business Modules](#key-business-modules)
8. [AI Integration](#ai-integration)
9. [Testing Strategy](#testing-strategy)
10. [Deployment](#deployment)
11. [Important Guidelines](#important-guidelines)
12. [Common Tasks](#common-tasks)
13. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

This is a **commercial-grade, multi-tenant Enterprise Resource Planning (ERP) system** designed for small to enterprise-level businesses. The system uses a **single codebase with tiered licensing** to serve different customer segments.

### Core Characteristics

- **Multi-Tenant Architecture**: Single codebase serving multiple organizations with complete data isolation
- **Row-Level Security (RLS)**: All data automatically filtered by `tenant_id`
- **Tiered Licensing**: Three product tiers (L1/L2/L3) with feature gating
- **Monorepo Structure**: Using Turborepo with pnpm workspaces
- **Type-Safe**: Full TypeScript coverage across frontend and backend
- **Modern Stack**: React 18, Fastify, PostgreSQL, Redis, Prisma

### Business Model

| Tier | Name | Users | Key Features |
|------|------|-------|--------------|
| **L1** | Standard | 5 | Core inventory, basic reports, invoicing |
| **L2** | Professional | 25 | L1 + Predictive analytics, demand forecasting |
| **L3** | Enterprise | Unlimited | L2 + AI chat assistant, audit logs, API access |

---

## 📁 Codebase Structure

```
erp-system/
├── apps/
│   ├── web/                      # React Frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/       # UI Components
│   │   │   │   ├── ui/           # shadcn/ui base components
│   │   │   │   ├── layout/       # Layout components (Sidebar, Header)
│   │   │   │   ├── invoice/      # Invoice module components
│   │   │   │   ├── einvoice/     # E-Invoice (LHDN Malaysia) components
│   │   │   │   └── currency/     # Multi-currency components
│   │   │   ├── routes/           # TanStack Router pages
│   │   │   ├── stores/           # Zustand state stores
│   │   │   ├── lib/              # Utilities and helpers
│   │   │   ├── config/           # App configuration
│   │   │   └── styles/           # Global CSS
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   ├── api/                      # Fastify Backend
│   │   ├── src/
│   │   │   ├── routes/           # API route handlers
│   │   │   │   ├── auth.ts       # Authentication endpoints
│   │   │   │   ├── health.ts     # Health checks
│   │   │   │   └── v1/           # Versioned API routes
│   │   │   ├── middleware/       # Auth, license, logging middleware
│   │   │   ├── services/         # Business logic services
│   │   │   ├── plugins/          # Fastify plugins
│   │   │   └── lib/              # Utilities (JWT, logging, etc.)
│   │   ├── server.ts             # Server initialization
│   │   └── index.ts              # Entry point
│   │
│   └── ai-service/               # Python ML Service (L2+)
│       ├── app/
│       │   ├── main.py           # FastAPI app
│       │   ├── routes/           # API endpoints
│       │   └── services/         # ML services
│       ├── models/               # Trained ML models
│       └── requirements.txt
│
├── packages/
│   ├── database/                 # Prisma ORM
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # Database schema
│   │   │   └── seed.ts           # Seed data
│   │   └── src/index.ts          # Client exports
│   │
│   ├── shared-types/             # Shared TypeScript types
│   │   └── src/
│   │       ├── api.ts            # API request/response types
│   │       ├── auth.ts           # Authentication types
│   │       ├── entities.ts       # Business entity types
│   │       ├── license.ts        # License types
│   │       ├── tenant.ts         # Multi-tenant types
│   │       ├── currency.ts       # Currency types
│   │       └── einvoice.ts       # E-Invoice types
│   │
│   ├── license/                  # License validation
│   │   └── src/
│   │       ├── license-validator.ts
│   │       ├── license-generator.ts
│   │       └── tier-guard.ts
│   │
│   ├── logger/                   # Structured logging
│   │   └── src/
│   │       ├── index.ts
│   │       ├── transports.ts
│   │       └── types.ts
│   │
│   └── config/                   # Shared configurations
│       ├── eslint/
│       └── typescript/
│
├── scripts/                      # Automation scripts
│   ├── admin/                    # Admin operations
│   ├── dev/                      # Development helpers
│   ├── deploy/                   # Deployment scripts
│   ├── maintenance/              # Backup, logs, etc.
│   └── utils/                    # Utility scripts
│
├── docs/                         # Documentation
│   ├── ai-setup-guide.md
│   ├── ai-quick-start.md
│   ├── forecasting-integration.md
│   └── logging-guide.md
│
├── docker-compose.yml            # Development containers
├── turbo.json                    # Turborepo configuration
├── pnpm-workspace.yaml           # Workspace configuration
├── package.json                  # Root package.json
├── .cursorrules                  # Cursor AI rules
└── README.md                     # User-facing documentation
```

### Package Dependency Flow

```
apps/web ──┬──> packages/shared-types
           ├──> packages/database (types only)
           └──> packages/ui (future)

apps/api ──┬──> packages/shared-types
           ├──> packages/database
           ├──> packages/license
           └──> packages/logger

apps/ai-service (independent Python service)
```

---

## 🛠️ Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI framework with hooks |
| **TypeScript** | 5.3+ | Type safety |
| **Vite** | Latest | Build tool and dev server |
| **TanStack Router** | Latest | Type-safe routing |
| **TanStack Query** | Latest | Server state management |
| **Zustand** | Latest | Client state management |
| **Tailwind CSS** | Latest | Utility-first CSS |
| **shadcn/ui** | Latest | Accessible component library |
| **Recharts** | Latest | Data visualization |
| **react-to-print** | Latest | Document printing |

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | JavaScript runtime |
| **Fastify** | Latest | High-performance web framework |
| **TypeScript** | 5.3+ | Type safety |
| **Prisma** | Latest | Type-safe ORM |
| **PostgreSQL** | 15+ | Primary database |
| **Redis** | 7+ | Caching and sessions |
| **BullMQ** | Latest | Background job queues |
| **Winston** | Latest | Structured logging |
| **Zod** | Latest | Runtime validation |

### AI Services
| Technology | Purpose |
|------------|---------|
| **Python 3.10+** | ML runtime |
| **FastAPI** | ML service API |
| **Scikit-learn** | Predictive analytics (L2) |
| **Ollama** | LLM chat assistant (L3) |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Docker** | Containerization |
| **Docker Compose** | Local development orchestration |
| **Turborepo** | Monorepo task runner |
| **pnpm** | Fast, disk-efficient package manager |

---

## 🏗️ Architecture Patterns

### 1. Multi-Tenancy Implementation

**Primary Pattern: Row-Level Security (RLS)**

All business data tables include a `tenant_id` column with automatic filtering:

```typescript
// Prisma middleware for tenant isolation
prisma.$use(async (params, next) => {
  const tenantId = getTenantFromContext();

  if (params.model && TENANT_ISOLATED_MODELS.includes(params.model)) {
    // Auto-inject tenant_id for queries
    if (['findMany', 'findFirst', 'findUnique'].includes(params.action)) {
      params.args.where = { ...params.args.where, tenantId };
    }

    // Auto-inject tenant_id for creates
    if (params.action === 'create') {
      params.args.data = { ...params.args.data, tenantId };
    }
  }

  return next(params);
});
```

**Database Schema Pattern:**

```prisma
model Product {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  name      String
  sku       String
  price     Decimal

  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  // Composite index for performance
  @@index([tenantId, id])
  @@index([tenantId, sku])
  @@unique([tenantId, sku])
}
```

**Enterprise Option (L3): Schema Isolation**

For maximum isolation, L3 clients can use dedicated PostgreSQL schemas:

```typescript
// Dynamic schema switching
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `${DATABASE_URL}?schema=tenant_${tenantId}`
    }
  }
});
```

### 2. License System Architecture

**License Storage:**

```prisma
model License {
  id          String      @id @default(uuid())
  tenantId    String      @map("tenant_id")
  tier        LicenseTier // L1, L2, L3
  encryptedKey String     @map("encrypted_key")
  features    Json        // Feature flags
  validFrom   DateTime    @map("valid_from")
  validUntil  DateTime    @map("valid_until")
  isActive    Boolean     @default(true)

  tenant      Tenant      @relation(fields: [tenantId], references: [id])
}
```

**Feature Gating Pattern:**

```typescript
// Backend enforcement (required)
import { requiresTier } from '@erp/license';

fastify.get('/api/v1/forecasting/predict', {
  preHandler: [authenticate, requiresTier(['L2', 'L3'])],
  handler: async (request, reply) => {
    // L2/L3 only feature
  }
});

// Frontend UI hiding (UX only, not security)
function ForecastingButton() {
  const { tier } = useLicense();

  if (!['L2', 'L3'].includes(tier)) {
    return <UpgradeTierPrompt feature="Demand Forecasting" />;
  }

  return <Button onClick={runForecast}>Run Forecast</Button>;
}
```

**License Validation Flow:**

```
User Login → JWT issued with tier info → Cached in Redis
                                               ↓
Every API Request → Middleware checks tier → Allow/Deny
                                               ↓
Feature flags checked for fine-grained control
```

### 3. Authentication & Authorization

**JWT Token Structure:**

```typescript
interface JWTPayload {
  userId: string;
  tenantId: string;
  tier: 'L1' | 'L2' | 'L3';
  role: 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';
  permissions: string[];
  iat: number;
  exp: number;
}
```

**Access Control Hierarchy:**

```
ADMIN      → Full access to tenant data, user management
MANAGER    → Read/write business data, reports
USER       → Create orders, invoices, basic operations
VIEWER     → Read-only access
```

### 4. API Response Format

**Standardized Response Structure:**

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}
```

**Example Usage:**

```typescript
// Success response
return reply.send({
  success: true,
  data: products,
  meta: { page: 1, limit: 50, total: 123, totalPages: 3 }
});

// Error response
return reply.status(404).send({
  success: false,
  error: {
    code: 'PRODUCT_NOT_FOUND',
    message: 'Product with ID xyz not found',
    details: { productId: 'xyz' }
  }
});
```

### 5. Database Conventions

**All models must include:**

```prisma
model Example {
  id        String    @id @default(uuid()) @db.Uuid
  tenantId  String    @map("tenant_id") @db.Uuid
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")  // Soft delete

  tenant    Tenant    @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
  @@map("examples")
}
```

**Naming Conventions:**

- Database tables: `snake_case` plural (e.g., `inventory_items`)
- Prisma models: `PascalCase` singular (e.g., `InventoryItem`)
- Columns: `camelCase` in Prisma, `snake_case` in DB via `@map()`
- Foreign keys: `{model}Id` in Prisma, `{model}_id` in DB

---

## 🔄 Development Workflow

### Initial Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure (PostgreSQL, Redis)
docker-compose up -d postgres redis

# 3. Set up database
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:seed      # Seed demo data

# 4. Start development servers
pnpm dev          # Starts web + api in parallel
```

### Common Development Commands

```bash
# Development
pnpm dev                    # Start all apps in dev mode
pnpm dev --filter @erp/web  # Start only frontend
pnpm dev --filter @erp/api  # Start only backend

# Building
pnpm build                  # Build all packages and apps
pnpm build --filter @erp/web

# Code Quality
pnpm lint                   # Lint all packages
pnpm type-check             # TypeScript type checking
pnpm format                 # Format code with Prettier
pnpm test                   # Run all tests
pnpm test:coverage          # Run tests with coverage

# Database
pnpm db:generate            # Generate Prisma client
pnpm db:push                # Push schema (dev only)
pnpm db:migrate             # Run migrations (production)
pnpm db:seed                # Seed database
pnpm db:studio              # Open Prisma Studio GUI
pnpm db:reset               # Reset database with fresh data

# Tenant & License Management
pnpm tenant:create -- --name "Test Corp" --tier L2
pnpm tenant:list
pnpm license:generate -- --tenant-id <uuid> --tier L2

# AI Services (L2/L3)
docker-compose --profile ai up -d  # Start AI services
./scripts/test-ai-services.sh      # Verify AI setup

# Utilities
pnpm check:ports            # Check if required ports are available
pnpm check:env              # Validate environment variables
pnpm clean                  # Clean build artifacts
```

### Git Workflow

**Branch Naming:**

- `feature/add-expense-tracking` - New features
- `fix/invoice-calculation-bug` - Bug fixes
- `refactor/update-auth-flow` - Code refactoring
- `docs/update-api-docs` - Documentation
- `chore/update-dependencies` - Maintenance

**Commit Message Format (Conventional Commits):**

```
type(scope): brief description

Detailed explanation (optional)

Fixes #123
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `refactor:` - Code refactoring (no behavior change)
- `perf:` - Performance improvement
- `test:` - Add/update tests
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `style:` - Code style changes (formatting)

**Example:**

```bash
git commit -m "feat(invoicing): add multi-currency support

- Added currency selector to invoice form
- Updated price calculations with exchange rates
- Added currency conversion API integration

Closes #456"
```

---

## 📝 Code Conventions

### TypeScript Standards

**Strict Mode Always Enabled:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Naming Conventions:**

```typescript
// PascalCase: Types, Interfaces, Classes, Components
type ProductFilter = { ... };
interface CustomerData { ... };
class LicenseValidator { ... }
function ProductList() { ... }

// camelCase: Functions, variables, properties
const calculateTotal = () => { ... };
const userName = 'John';
const product = { productName: 'Widget' };

// UPPER_SNAKE_CASE: Constants, environment variables
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = process.env.VITE_API_BASE_URL;

// kebab-case: File names
// product-list.tsx
// invoice-form.tsx
// license-validator.ts
```

**Type Definitions:**

```typescript
// Prefer interfaces for object shapes
interface Product {
  id: string;
  name: string;
  price: number;
}

// Use types for unions, intersections, utilities
type ProductStatus = 'active' | 'discontinued' | 'out_of_stock';
type ProductWithInventory = Product & { stockLevel: number };

// Always type function parameters and returns
function calculateDiscount(
  price: number,
  discountPercent: number
): number {
  return price * (1 - discountPercent / 100);
}

// Use generics for reusable code
function createApiResponse<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}
```

### React Component Standards

**Component Structure:**

```typescript
// 1. Imports (grouped: external → internal → types → styles)
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@erp/shared-types';

// 2. Types/Interfaces
interface ProductListProps {
  categoryId?: string;
  onProductSelect: (product: Product) => void;
}

// 3. Component definition
export function ProductList({
  categoryId,
  onProductSelect
}: ProductListProps) {
  // 4. Hooks (state, effects, queries)
  const [search, setSearch] = useState('');
  const { data, isLoading } = useQuery({ ... });

  useEffect(() => {
    // Side effects
  }, []);

  // 5. Event handlers
  const handleSearch = (value: string) => {
    setSearch(value);
  };

  // 6. Early returns (loading, error states)
  if (isLoading) return <LoadingSpinner />;
  if (!data) return <EmptyState />;

  // 7. Main JSX
  return (
    <div className="space-y-4">
      {/* Component content */}
    </div>
  );
}
```

**Component Best Practices:**

```typescript
// ✅ Good: Explicit prop types
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

// ❌ Bad: Any types
interface ButtonProps {
  props: any;
}

// ✅ Good: Destructure props
export function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  // ...
}

// ❌ Bad: Access via props object
export function Button(props: ButtonProps) {
  return <button onClick={props.onClick}>{props.label}</button>;
}

// ✅ Good: Memoize expensive calculations
const sortedProducts = useMemo(
  () => products.sort((a, b) => a.price - b.price),
  [products]
);

// ✅ Good: Memoize callbacks passed to children
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

### API Route Design

**RESTful Conventions:**

```typescript
// List resources (with pagination)
GET /api/v1/products?page=1&limit=50&category=electronics

// Get single resource
GET /api/v1/products/:id

// Create resource
POST /api/v1/products
Body: { name, sku, price, ... }

// Update resource (partial)
PATCH /api/v1/products/:id
Body: { price: 99.99 }

// Replace resource (full)
PUT /api/v1/products/:id
Body: { name, sku, price, ... }

// Delete resource
DELETE /api/v1/products/:id

// Nested resources
GET /api/v1/products/:productId/inventory
POST /api/v1/customers/:customerId/orders

// Actions (non-CRUD)
POST /api/v1/invoices/:id/send
POST /api/v1/orders/:id/approve
```

**Fastify Route Example:**

```typescript
import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { authenticate, requiresTier } from '@/middleware';

const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // List products
  fastify.get(
    '/products',
    {
      preHandler: [authenticate],
      schema: {
        querystring: z.object({
          page: z.coerce.number().min(1).default(1),
          limit: z.coerce.number().min(1).max(100).default(50),
          category: z.string().optional()
        })
      }
    },
    async (request, reply) => {
      const { page, limit, category } = request.query;
      const tenantId = request.user.tenantId;

      const products = await prisma.product.findMany({
        where: {
          tenantId,
          ...(category && { categoryId: category })
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      const total = await prisma.product.count({
        where: { tenantId, ...(category && { categoryId: category }) }
      });

      return reply.send({
        success: true,
        data: products,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    }
  );

  // Create product
  fastify.post(
    '/products',
    {
      preHandler: [authenticate],
      schema: {
        body: z.object({
          name: z.string().min(1).max(255),
          sku: z.string().min(1).max(100),
          price: z.number().positive(),
          categoryId: z.string().uuid()
        })
      }
    },
    async (request, reply) => {
      const tenantId = request.user.tenantId;

      const product = await prisma.product.create({
        data: {
          ...request.body,
          tenantId
        }
      });

      return reply.status(201).send({
        success: true,
        data: product
      });
    }
  );
};

export default productsRoutes;
```

### Database Query Best Practices

```typescript
// ✅ Good: Select only needed fields
const products = await prisma.product.findMany({
  select: {
    id: true,
    name: true,
    sku: true,
    price: true
  }
});

// ❌ Bad: Fetch all fields
const products = await prisma.product.findMany();

// ✅ Good: Use includes for relations
const order = await prisma.order.findUnique({
  where: { id },
  include: {
    customer: { select: { name: true, email: true } },
    items: { include: { product: true } }
  }
});

// ✅ Good: Use transactions for multi-step operations
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({ data: orderData });
  await tx.inventoryItem.updateMany({
    where: { productId: { in: productIds } },
    data: { quantity: { decrement: 1 } }
  });
});

// ✅ Good: Handle errors gracefully
try {
  const product = await prisma.product.create({ data });
} catch (error) {
  if (error.code === 'P2002') {
    throw new Error('SKU already exists');
  }
  throw error;
}
```

---

## 💼 Key Business Modules

### 1. Inventory Management

**Location**: `apps/api/src/routes/v1/inventory.ts`

**Core Entities:**
- `Product` - SKU, name, pricing, category
- `Category` - Product categorization
- `Warehouse` - Storage locations
- `InventoryItem` - Stock levels per product per warehouse
- `InventoryMovement` - Stock adjustments, transfers

**Key Features:**
- Multi-warehouse support (L2+)
- Stock level tracking
- Low stock alerts
- Inventory adjustments
- Stock transfers between warehouses

### 2. Order Management

**Location**: `apps/api/src/routes/v1/orders.ts`

**Core Entities:**
- `Order` - Sales and purchase orders
- `OrderItem` - Line items in orders

**Key Features:**
- Order creation and approval workflow
- Order status tracking (Draft → Approved → Fulfilled → Shipped)
- Order fulfillment from inventory
- Purchase orders to suppliers

### 3. Customer Management

**Location**: `apps/api/src/routes/v1/customers.ts`

**Core Entities:**
- `Customer` - Customer database
- `Supplier` - Supplier database

**Key Features:**
- Customer profiles with contact information
- Credit limit tracking
- Order history
- Customer statements

### 4. Invoicing & Payments

**Location**: `apps/web/src/components/invoice/`

**Core Entities:**
- `Invoice` - Customer invoices
- `Payment` - Payment records

**Key Features:**
- Professional invoice generation
- Live preview during creation
- Print-to-inventory workflow (inventory deducted after print)
- Payment tracking
- E-Invoice integration (LHDN Malaysia)

**Invoice Workflow:**

```typescript
// 1. User fills invoice form → 2. Live preview updates
// 3. User clicks print → 4. Browser print dialog
// 5. After print confirmation → 6. Deduct inventory

const handleAfterPrint = useCallback(async () => {
  // Only deduct inventory after actual print
  await deductInventoryMutation.mutateAsync({
    invoiceId: invoice.id,
    items: invoice.items
  });
}, [invoice]);
```

### 5. Reporting & Analytics

**Location**: `apps/api/src/routes/v1/reports.ts`

**Report Types:**
- Sales summary
- Inventory status
- Customer analytics
- Financial reports

**L2+ Features:**
- Trend analysis
- Seasonal patterns
- Financial projections

### 6. AI Forecasting (L2+)

**Location**: `apps/ai-service/`

**Technology**: Python + FastAPI + Scikit-learn

**Features:**
- Demand prediction
- Stock optimization
- Automatic reorder point suggestions

**Integration Pattern:**

```typescript
// Backend triggers async job
fastify.post('/api/v1/forecasting/predict', async (request, reply) => {
  const job = await forecastQueue.add('predict-demand', {
    tenantId: request.user.tenantId,
    productIds: request.body.productIds
  });

  return reply.send({
    success: true,
    data: { jobId: job.id }
  });
});

// Frontend polls for results
const { data } = useQuery({
  queryKey: ['forecast', jobId],
  queryFn: () => api.getForecastResult(jobId),
  refetchInterval: 2000,
  enabled: !!jobId
});
```

### 7. AI Chat Assistant (L3)

**Location**: `apps/api/src/routes/v1/ai-chat.ts`

**Technology**: Ollama (LLaMA, Mistral, etc.)

**Features:**
- Natural language queries about business data
- Context-aware responses
- Business insights

---

## 🤖 AI Integration

### L2 Tier: Python AI Service

**Purpose**: Predictive analytics and demand forecasting using machine learning

**Setup:**

```bash
# Using Docker (recommended)
docker-compose --profile ai up -d ai-service

# Or local development
cd apps/ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Environment Variables:**

```env
# apps/api/.env
AI_SERVICE_URL=http://localhost:8000
```

**API Endpoints:**

```
POST /predict/demand       - Predict product demand
POST /optimize/stock       - Optimize stock levels
GET  /health               - Service health check
```

### L3 Tier: Ollama Chat Assistant

**Purpose**: Natural language interface for ERP queries

**Setup:**

```bash
# Using Docker (recommended)
docker-compose --profile ai up -d ollama

# Download model
docker exec -it erp-ollama ollama pull llama2

# Or local installation
# Download from https://ollama.ai/download
ollama pull llama2
```

**Environment Variables:**

```env
# apps/api/.env
OLLAMA_API_URL=http://localhost:11434
```

**Usage Pattern:**

```typescript
// User asks: "What were our top selling products last month?"

// Backend sends context + query to Ollama
const context = await buildBusinessContext(tenantId);
const response = await ollama.chat({
  model: 'llama2',
  messages: [
    { role: 'system', content: context },
    { role: 'user', content: userQuery }
  ]
});
```

**Verification:**

```bash
# Test AI services
./scripts/test-ai-services.sh
```

---

## 🧪 Testing Strategy

### Testing Stack

- **Unit Tests**: Vitest
- **Component Tests**: React Testing Library
- **API Tests**: Supertest
- **E2E Tests**: Playwright

### Running Tests

```bash
# All tests
pnpm test

# With coverage
pnpm test:coverage

# Specific package
pnpm --filter @erp/api test
pnpm --filter @erp/web test

# E2E tests
pnpm test:e2e

# Watch mode (during development)
pnpm --filter @erp/api test:watch
```

### Test File Locations

```
apps/api/src/
├── routes/
│   └── v1/
│       ├── products.ts
│       └── products.test.ts    # Co-located tests

apps/web/src/
├── components/
│   └── invoice/
│       ├── invoice-form.tsx
│       └── invoice-form.test.tsx

tests/
└── e2e/
    ├── login.spec.ts
    ├── create-order.spec.ts
    └── invoice-workflow.spec.ts
```

### Test Examples

**Unit Test (Backend):**

```typescript
import { describe, it, expect } from 'vitest';
import { calculateOrderTotal } from './order-utils';

describe('calculateOrderTotal', () => {
  it('calculates total with tax', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 1 }
    ];

    const total = calculateOrderTotal(items, 0.1); // 10% tax
    expect(total).toBe(275); // (200 + 50) * 1.1
  });
});
```

**Component Test:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProductList } from './product-list';

describe('ProductList', () => {
  it('calls onProductSelect when product clicked', () => {
    const onSelect = vi.fn();
    render(<ProductList products={mockProducts} onProductSelect={onSelect} />);

    fireEvent.click(screen.getByText('Product 1'));
    expect(onSelect).toHaveBeenCalledWith(mockProducts[0]);
  });
});
```

### Coverage Target

- **Business logic**: 80%+
- **API routes**: 70%+
- **Components**: 70%+
- **Overall**: 70%+

---

## 🚀 Deployment

### Development Environment

```bash
# Start all infrastructure
docker-compose up -d postgres redis

# Optional: AI services
docker-compose --profile ai up -d

# Start development servers
pnpm dev
```

**Accessed at:**
- Frontend: http://localhost:5173
- API: http://localhost:3000
- API Docs: http://localhost:3000/docs
- Prisma Studio: `pnpm db:studio`

### Production Deployment

**Recommended Architecture:**

```
Load Balancer (ALB/nginx)
         ↓
   Frontend (CDN)
         ↓
   API Cluster (Kubernetes/ECS)
         ↓
   ┌─────┴──────┬──────────┬──────────┐
   ↓            ↓          ↓          ↓
PostgreSQL    Redis    AI Service  Ollama
(RDS/Aurora) (ElastiCache)
```

**Build Production Assets:**

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Run database migrations
pnpm db:migrate

# Build all packages and apps
pnpm build

# Output:
# - apps/web/dist/        → Static files for CDN
# - apps/api/dist/        → Node.js server files
```

**Docker Production Images:**

See README.md for detailed Dockerfile examples.

**Environment Variables (Production):**

```env
# Generate strong secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
LICENSE_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Use managed services
DATABASE_URL=postgresql://user:pass@rds-host:5432/erp?sslmode=require
REDIS_URL=redis://elasticache-host:6379

# Production settings
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=info
```

**Kubernetes Deployment:**

See `README.md` section "Production Deployment" for Kubernetes manifests.

**Health Checks:**

```bash
# Verify deployment
./scripts/deploy/health-check.sh --env prod

# Check API health
curl https://api.yourdomain.com/health

# Response:
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "uptime": 123456
}
```

---

## ⚠️ Important Guidelines

### Security

**Authentication:**
- All API routes require authentication except `/auth/*` and `/health`
- JWT tokens with short expiration (15 min access, 7 days refresh)
- Token payload includes `tenantId` for data isolation

**Input Validation:**
- Use Zod schemas for all API inputs
- Validate on backend (required) and frontend (UX)
- Sanitize rich text with DOMPurify

**SQL Injection:**
- Prevented by Prisma's parameterized queries
- Never use raw SQL without parameterization

**XSS Protection:**
- React escapes by default
- Be careful with `dangerouslySetInnerHTML`

**CSRF:**
- SameSite cookies
- CSRF tokens for state-changing operations

**Rate Limiting:**
- 100 requests/minute per IP (unauthenticated)
- 1000 requests/minute per authenticated user

### Performance

**Database Queries:**
- Always use `select` to fetch only needed fields
- Add indexes for filtered columns
- Use pagination for list endpoints (max 100 items)

**Caching:**
- Redis for session data
- Cache computed reports
- Cache license information

**Frontend:**
- Use React.memo for expensive components
- useMemo for expensive calculations
- useCallback for callbacks passed to children
- Lazy load routes with TanStack Router

**API:**
- Background jobs for long-running tasks (AI predictions, bulk operations)
- Streaming for large data exports

### Accessibility

**Requirements**: WCAG 2.1 AA compliance

**Implementation:**
- Semantic HTML (`<button>`, `<nav>`, `<main>`)
- ARIA labels for icons and controls
- Keyboard navigation support (Tab, Enter, Esc)
- Focus indicators
- Sufficient color contrast (4.5:1)
- Skip navigation links

**Testing:**
- Use screen reader testing
- Keyboard-only navigation testing
- axe DevTools for automated checks

### Code Quality

**Principles:**
1. **Type Safety**: If it compiles, it probably works
2. **DRY with Balance**: Abstract when it clarifies, not obscures
3. **Fail Fast**: Validate inputs early, throw descriptive errors
4. **Readability**: Code is read more than written
5. **No Premature Optimization**: Profile before optimizing

**Before Committing:**
- Run `pnpm lint`
- Run `pnpm type-check`
- Run `pnpm test`
- Ensure no console errors in browser

---

## 🔧 Common Tasks

### Adding a New Feature

**Step-by-step guide:**

1. **Plan the Feature**
   - Identify tier requirement (L1/L2/L3)
   - Design database schema changes
   - Plan API endpoints
   - Sketch UI components

2. **Update Database Schema**

```bash
# Edit packages/database/prisma/schema.prisma
model NewFeature {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String   @map("tenant_id") @db.Uuid
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  tenant    Tenant   @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
  @@map("new_features")
}

# Create migration
pnpm db:migrate:dev

# Generate Prisma client
pnpm db:generate
```

3. **Add Shared Types**

```typescript
// packages/shared-types/src/entities.ts
export interface NewFeature {
  id: string;
  tenantId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNewFeatureRequest {
  name: string;
}
```

4. **Create API Routes**

```typescript
// apps/api/src/routes/v1/new-feature.ts
import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '@/middleware';
import { z } from 'zod';

const newFeatureRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/new-features', {
    preHandler: [authenticate],
    handler: async (request, reply) => {
      const features = await prisma.newFeature.findMany({
        where: { tenantId: request.user.tenantId }
      });

      return reply.send({ success: true, data: features });
    }
  });

  fastify.post('/new-features', {
    preHandler: [authenticate],
    schema: {
      body: z.object({ name: z.string().min(1) })
    },
    handler: async (request, reply) => {
      const feature = await prisma.newFeature.create({
        data: {
          ...request.body,
          tenantId: request.user.tenantId
        }
      });

      return reply.status(201).send({ success: true, data: feature });
    }
  });
};

export default newFeatureRoutes;
```

5. **Register Route**

```typescript
// apps/api/src/routes/v1/index.ts
import newFeatureRoutes from './new-feature';

export default async function v1Routes(fastify: FastifyInstance) {
  // ... other routes
  fastify.register(newFeatureRoutes);
}
```

6. **Create Frontend Components**

```typescript
// apps/web/src/components/new-feature/new-feature-list.tsx
export function NewFeatureList() {
  const { data, isLoading } = useQuery({
    queryKey: ['new-features'],
    queryFn: () => api.getNewFeatures()
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {data?.data.map(feature => (
        <div key={feature.id}>{feature.name}</div>
      ))}
    </div>
  );
}
```

7. **Add Route**

```typescript
// apps/web/src/routes/new-feature.tsx
import { createFileRoute } from '@tanstack/react-router';
import { NewFeatureList } from '@/components/new-feature/new-feature-list';

export const Route = createFileRoute('/new-feature')({
  component: NewFeaturePage
});

function NewFeaturePage() {
  return (
    <div>
      <h1>New Feature</h1>
      <NewFeatureList />
    </div>
  );
}
```

8. **Add Navigation**

Update sidebar navigation to include new feature.

9. **Test**

```bash
# Backend tests
pnpm --filter @erp/api test

# Frontend tests
pnpm --filter @erp/web test

# E2E tests
pnpm test:e2e
```

### Modifying Existing Features

1. **Identify Impact**: Check where the feature is used (API, frontend, database)
2. **Update Database**: Create migration if schema changes
3. **Update Types**: Modify shared types if data structure changes
4. **Update Backend**: Modify API routes and business logic
5. **Update Frontend**: Update components and queries
6. **Run Tests**: Ensure existing tests pass
7. **Manual Testing**: Test in development environment

### Debugging Common Issues

**Database Connection Errors:**

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check connection string
echo $DATABASE_URL

# Reset database
pnpm db:reset
```

**Build Errors:**

```bash
# Clear cache and rebuild
pnpm clean
pnpm install
pnpm build
```

**Type Errors:**

```bash
# Regenerate Prisma client
pnpm db:generate

# Check TypeScript
pnpm type-check
```

**Port Already in Use:**

```bash
# Check what's using the port
pnpm check:ports

# Or manually
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

---

## 🐛 Troubleshooting

### Development Environment Issues

**Problem**: `pnpm install` fails

```bash
# Solution 1: Clear pnpm cache
pnpm store prune

# Solution 2: Delete node_modules and reinstall
pnpm clean
pnpm install
```

**Problem**: Prisma client not found

```bash
# Generate Prisma client
pnpm db:generate

# If still failing, check DATABASE_URL is set
echo $DATABASE_URL
```

**Problem**: Database migration fails

```bash
# Check database is running
docker-compose ps postgres

# Reset database (⚠️ destroys data)
pnpm db:reset

# Or manually reset
docker-compose down -v
docker-compose up -d postgres
pnpm db:push
pnpm db:seed
```

### Runtime Issues

**Problem**: Authentication fails

- Check JWT_SECRET is set in `apps/api/.env`
- Check token expiration
- Clear browser cookies/local storage

**Problem**: Tenant data not showing

- Verify tenant_id is correctly set in JWT
- Check Prisma middleware is active
- Check user is associated with correct tenant

**Problem**: License tier restriction not working

- Check license is active in database
- Verify middleware is registered in correct order
- Clear Redis cache: `docker-compose restart redis`

### AI Service Issues

**Problem**: AI service not responding

```bash
# Check if service is running
docker-compose ps ai-service

# Check logs
docker-compose logs ai-service

# Restart service
docker-compose restart ai-service
```

**Problem**: Ollama model not found

```bash
# List available models
docker exec -it erp-ollama ollama list

# Pull required model
docker exec -it erp-ollama ollama pull llama2
```

---

## 📚 Additional Resources

### Documentation

- **README.md** - User-facing setup and deployment guide
- **.cursorrules** - Cursor AI-specific development rules
- **docs/ai-setup-guide.md** - Detailed AI service setup (Chinese)
- **docs/ai-quick-start.md** - Quick AI setup instructions
- **docs/forecasting-integration.md** - ML forecasting integration guide
- **docs/logging-guide.md** - Logging best practices
- **LHDN_API.md** - Malaysian e-Invoice API documentation
- **LHDN_einvoice.md** - E-Invoice implementation notes

### External Resources

- **Prisma Docs**: https://www.prisma.io/docs
- **Fastify Docs**: https://www.fastify.io/docs
- **React Docs**: https://react.dev
- **TanStack Router**: https://tanstack.com/router
- **TanStack Query**: https://tanstack.com/query
- **shadcn/ui**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com

### Getting Help

1. Check this file (CLAUDE.md) first
2. Review README.md for setup issues
3. Check relevant documentation in `/docs`
4. Review `.cursorrules` for coding standards
5. Inspect existing code for patterns
6. Check git history for context: `git log --follow <file>`

---

## 🔄 Keeping This Document Updated

**This document should be updated when:**

- New major features are added
- Architecture patterns change
- New technologies are introduced
- Development workflows change
- Common issues are discovered

**Update process:**

1. Edit CLAUDE.md
2. Commit with: `docs(claude): update [section] with [changes]`
3. Ensure changes are reviewed for accuracy

---

**Document Version**: 1.0.0
**Last Updated**: December 2025
**Maintained By**: Development Team
