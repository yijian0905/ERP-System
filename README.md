# 🏢 Enterprise ERP System

A commercial-grade, multi-tenant Enterprise Resource Planning (ERP) system built with modern web technologies. Delivered primarily as a **Desktop Application (Electron)** with a shared Web build. Monetized via **License Keys** with **capability-based** feature gating.

> 📘 **Spec Version**: 1.2.0 | See [spec.md](spec.md) for full specification

![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)
![React](https://img.shields.io/badge/React-18.2-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql)
![Electron](https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [License Tiers](#-license-tiers)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Development Deployment](#-development-deployment)
- [Production Deployment](#-production-deployment)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Testing](#-testing)
- [Contributing](#-contributing)

---

## 🎯 Overview

This ERP system is designed for small to enterprise-level businesses requiring comprehensive resource planning capabilities. The system provides:

- **Multi-Tenant Architecture**: Single codebase serving multiple organizations with complete data isolation
- **Row-Level Security (RLS)**: All data is automatically filtered by `tenant_id` ensuring data privacy
- **Capability-Based Licensing**: Feature access gated by capabilities (not hard-coded tiers)
- **Desktop + Web Delivery**: Primary Electron desktop app with shared web build for development
- **Real-time Analytics**: Dashboard with live metrics and reporting
- **Enterprise AI**: AI chat with agent-ready architecture (Enterprise tier)

### Key Business Modules

| Module | Description |
|--------|-------------|
| **Inventory Management** | Track products, stock levels, warehouses, and movements |
| **Order Management** | Sales orders, purchase orders, and order fulfillment |
| **Customer Management** | Customer database, credit limits, and communication history |
| **Invoicing & Payments** | Invoice generation, payment tracking, and accounts receivable |
| **Supplier Management** | Supplier database, pricing, and lead time tracking |
| **Reporting & Analytics** | Sales reports, inventory reports, and financial summaries |
| **AI Forecasting** | Demand prediction and stock optimization (PRO+) |
| **AI Assistant** | Natural language queries and insights (ENTERPRISE) |

---

## ✨ Features

### Core Features (All Tiers)

- 📦 **Product Catalog** - SKU management, categories, pricing, and inventory tracking
- 🏭 **Warehouse Management** - Multiple locations, stock transfers, and bin tracking
- 👥 **Customer Management** - Customer profiles, credit limits, and order history
- 📄 **Invoicing** - Professional invoices with live preview and print-to-inventory workflow
- 📊 **Basic Reports** - Sales summary, inventory status, and customer analytics
- 🔐 **Role-Based Access** - Admin, Manager, User, and Viewer roles
- 🌙 **Dark Mode** - System preference detection with manual override

### Professional Features (PRO+)

- 📈 **Predictive Analytics** - AI-powered demand forecasting using Scikit-learn
- 🔮 **Stock Optimization** - Automatic reorder point suggestions
- 📉 **Advanced Reports** - Trend analysis, seasonal patterns, and financial projections
- 🏪 **Multi-Warehouse** - Advanced inventory distribution and transfer optimization
- 🏷️ **Batch Tracking** - Lot numbers, expiry dates, and serial numbers

### Enterprise Features (ENTERPRISE)

- 🤖 **AI Chat Assistant** - Natural language queries powered by Ollama (agent-ready)
- 📝 **Audit Logs** - Complete change history for compliance
- 🔌 **Custom Integrations** - API access and webhook support
- 💱 **Multi-Currency** - International pricing and exchange rates
- 🏗️ **Schema Isolation** - Dedicated database schemas per tenant (optional)

---

## 📊 Subscription Tiers & Capabilities

> ⚠️ **Engineering Note**: Tiers are business-facing labels only. All feature enforcement is via **capabilities** returned from the server.

### Capability Codes

| Capability | BASIC | PRO | ENTERPRISE | Description |
|------------|:-----:|:---:|:----------:|-------------|
| `erp_core` | ✅ | ✅ | ✅ | Core ERP functionality |
| `forecasting` | ❌ | ✅ | ✅ | AI-powered demand forecasting |
| `ai_chat` | ❌ | ❌ | ✅ | AI chat assistant |
| `ai_agent` | ❌ | ❌ | 🔒 | AI agent actions (default off) |
| `automation_rules` | ❌ | ❌ | 🔒 | Automation rules (future) |

### Feature Matrix

| Feature | BASIC | PRO | ENTERPRISE |
|---------|:-----:|:---:|:----------:|
| Core Inventory | ✅ | ✅ | ✅ |
| Basic Reports | ✅ | ✅ | ✅ |
| Invoicing | ✅ | ✅ | ✅ |
| Customer Management | ✅ | ✅ | ✅ |
| Order Management | ✅ | ✅ | ✅ |
| Max Users | 5 | 25 | Unlimited |
| Predictive Analytics | ❌ | ✅ | ✅ |
| Demand Forecasting | ❌ | ✅ | ✅ |
| Advanced Reports | ❌ | ✅ | ✅ |
| Multi-Warehouse | ❌ | ✅ | ✅ |
| AI Chat Assistant | ❌ | ❌ | ✅ |
| Audit Logs | ❌ | ❌ | ✅ |
| API Access | ❌ | ❌ | ✅ |
| Schema Isolation | ❌ | ❌ | ✅ |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI Framework |
| TypeScript | Type Safety |
| Vite | Build Tool |
| TanStack Router | Type-safe Routing |
| TanStack Query | Server State Management |
| Zustand | Client State Management |
| Tailwind CSS | Styling |
| shadcn/ui | UI Components |
| Recharts | Data Visualization |
| react-to-print | Print Functionality |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js 20+ | Runtime |
| Fastify | Web Framework |
| TypeScript | Type Safety |
| Prisma | ORM |
| PostgreSQL 15+ | Database |
| Redis | Caching & Sessions |
| BullMQ | Background Jobs |
| Winston | Logging |
| Zod | Validation |

### AI Services
| Technology | Purpose |
|------------|---------|
| Python/FastAPI | ML Microservice |
| Scikit-learn | Predictive Analytics |
| Ollama | LLM Chat Assistant |

### Desktop (`apps/desktop`) - Future
| Technology | Purpose |
|------------|---------|
| Electron | Desktop Runtime |
| electron-builder | Packaging |
| electron-updater | Auto Updates |
| contextBridge | Secure IPC |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local Development |
| Turborepo | Monorepo Management |
| pnpm | Package Management |

---

## 📁 Project Structure

```
erp-system/
├── apps/
│   ├── web/                      # React Frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/       # UI Components
│   │   │   │   ├── ui/           # shadcn/ui components
│   │   │   │   ├── layout/       # Layout components
│   │   │   │   └── invoice/      # Invoice module
│   │   │   ├── routes/           # TanStack Router pages
│   │   │   ├── stores/           # Zustand stores
│   │   │   ├── lib/              # Utilities
│   │   │   ├── config/           # App configuration
│   │   │   └── styles/           # Global styles
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   │
│   ├── api/                      # Fastify Backend
│   │   ├── src/
│   │   │   ├── routes/           # API routes
│   │   │   │   ├── auth.ts       # Authentication
│   │   │   │   ├── health.ts     # Health checks
│   │   │   │   ├── license.ts    # License activation (NEW)
│   │   │   │   └── v1/           # API v1 routes
│   │   │   │       └── branding.ts # Branding API (NEW)
│   │   │   ├── middleware/       # Auth, License & Capability middleware
│   │   │   │   └── capability.ts # Capability gating (NEW)
│   │   │   └── lib/              # Utilities (JWT, logging)
│   │   └── tsconfig.json
│   │
│   ├── desktop/                  # Electron App (Future)
│   │   ├── src/
│   │   │   ├── main/             # Main process
│   │   │   ├── preload/          # Preload scripts
│   │   │   └── renderer/         # Shared with web
│   │   ├── electron-builder.yml
│   │   └── package.json
│   │
│   └── ai-service/               # Python ML Service (PRO+)
│       ├── app/
│       ├── models/
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
│   │       ├── api.ts            # API types
│   │       ├── auth.ts           # Auth types
│   │       ├── auth-policy.ts    # Auth policy (NEW)
│   │       ├── branding.ts       # Branding types (NEW)
│   │       ├── capability.ts     # Capability model (NEW)
│   │       ├── entities.ts       # Entity types
│   │       ├── license.ts        # License types (updated)
│   │       └── tenant.ts         # Tenant types
│   │
│   ├── license/                  # License validation
│   │   └── src/
│   │       ├── license-validator.ts
│   │       ├── license-generator.ts
│   │       └── tier-guard.ts
│   │
│   ├── ui/                       # Shared UI components
│   │
│   └── config/                   # Shared configurations
│       ├── eslint/
│       └── typescript/
│
├── docker-compose.yml            # Development containers
├── turbo.json                    # Turborepo config
├── pnpm-workspace.yaml           # Workspace config
└── package.json                  # Root package.json
```

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | ≥ 20.0.0 | Runtime |
| pnpm | ≥ 9.0.0 | Package Manager |
| Docker | Latest | Containers |
| Docker Compose | v2+ | Container Orchestration |
| Git | Latest | Version Control |

Optional for AI features:
| Software | Version | Purpose |
|----------|---------|---------|
| Python | ≥ 3.10 | AI Service (L2+) |
| Ollama | Latest | Chat Assistant (L3) |

---

## 🚀 Development Deployment

### Step 1: Clone the Repository

```bash
git clone https://github.com/your-org/erp-system.git
cd erp-system
```

### Step 2: Install Dependencies

```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install all workspace dependencies
pnpm install
```

### Step 3: Start Infrastructure Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Verify services are running
docker-compose ps
```

### Step 4: Configure Environment Variables

```bash
# Copy environment templates
cp apps/api/env.example.txt apps/api/.env
cp apps/web/env.example.txt apps/web/.env
cp packages/database/env.example.txt packages/database/.env

# Edit the .env files with your configuration
# See "Environment Variables" section for details
```

**apps/api/.env**
```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# Database
DATABASE_URL=postgresql://erp_user:erp_password@localhost:5432/erp_database

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-32-chars

# License
LICENSE_ENCRYPTION_KEY=your-license-encryption-key-32chars

# CORS
CORS_ORIGIN=http://localhost:5173
```

**apps/web/.env**
```env
# For development with Vite dev server
VITE_API_BASE_URL=/api
VITE_APP_NAME=ERP System
```

**packages/database/.env**
```env
# Database connection for Prisma CLI
DATABASE_URL=postgresql://erp_user:erp_password@localhost:5432/erp_database
```

### Step 5: Set Up the Database

```bash
# Generate Prisma client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Seed the database with demo data
pnpm --filter @erp/database db:seed
```

### Step 6: Start Development Servers

```bash
# Start all apps in development mode
pnpm dev
```

This will start:
  - **Frontend**: http://localhost:5173
  - **API**: http://localhost:3000
  - **API Docs**: http://localhost:3000/docs

### Step 7: Access the Application

Open http://localhost:5173 and log in with demo credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@demo-company.com | password123 |
| Manager | manager@demo-company.com | password123 |

### Development Commands

```bash
# First-time setup (installs deps, configures env, starts services)
pnpm setup

# Start all apps
pnpm dev

# Build all packages and apps
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm type-check

# Run tests
pnpm test

# Clean all build artifacts
pnpm clean

# Format code
pnpm format
```

### Database Commands

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:push        # Push schema (dev only)
pnpm db:migrate     # Run migrations
pnpm db:reset       # Reset database with fresh data
pnpm db:seed        # Seed demo data
pnpm db:backup      # Create backup
pnpm db:restore     # Restore from backup
pnpm db:studio      # Open Prisma Studio
```

### Tenant & License Commands

```bash
# Create test tenant with sample data
pnpm tenant:create -- --name "Test Corp" --tier L2

# List all tenants
pnpm tenant:list

# Generate test license
pnpm license:generate -- --tenant-id <uuid> --tier L2

# Generate production license
pnpm license:generate:prod -- --tenant-id <uuid> --tier L3

# Revoke license
pnpm license:revoke -- --license-id <uuid>
```

### Deployment Commands

```bash
# Deploy with Docker Compose
pnpm deploy:docker -- --env prod --build --migrate

# Deploy to Kubernetes
pnpm deploy:k8s -- --namespace production --tag v1.0.0

# Build Docker images
pnpm deploy:build -- --tag latest --push

# Check deployment health
pnpm deploy:check -- --env prod
```

### Utility Commands

```bash
# Check if required ports are available
pnpm check:ports

# Validate environment configuration
pnpm check:env -- --check-db --check-redis

# Rotate log files
pnpm maintenance:rotate-logs
```

### Optional: Enable AI Features

> 📖 **詳細設置指南**: 請參考 [AI 設置指南](docs/ai-setup-guide.md) 獲取完整的設置說明。

**快速設置：**

**L2 Features (Predictive Analytics) - Python AI Service:**

```bash
# 方法 1: 使用 Docker Compose（推薦）
docker-compose --profile ai up -d ai-service

# 方法 2: 本地開發
cd apps/ai-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example.txt .env
uvicorn app.main:app --reload --port 8000
```

**L3 Features (AI Chat) - Ollama:**

```bash
# 使用 Docker Compose（推薦）
docker-compose --profile ai up -d ollama

# 下載模型
docker exec -it erp-ollama ollama pull llama2

# 或本地安裝（Windows/Mac/Linux）
# 下載: https://ollama.ai/download
ollama pull llama2
```

**驗證 AI 服務：**

```bash
# Windows PowerShell（推薦）
.\scripts\test-ai-services.ps1

# Linux/Mac
chmod +x scripts/test-ai-services.sh
./scripts/test-ai-services.sh
```

**注意：** 在 Windows PowerShell 中，不需要 `chmod` 命令（Windows 不使用 Unix 權限系統）。如果您想執行 `.sh` 文件，需要使用 Git Bash 或 WSL。

**環境變數配置：**

確保 `apps/api/.env` 包含：
```env
AI_SERVICE_URL=http://localhost:8000
OLLAMA_API_URL=http://localhost:11434
```

---

## 🏭 Production Deployment

### Architecture Overview

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (nginx/ALB)   │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
    ┌─────────▼─────────┐       ┌──────────▼──────────┐
    │   Frontend CDN    │       │   API Cluster       │
    │   (CloudFront)    │       │   (Kubernetes/ECS)  │
    └───────────────────┘       └──────────┬──────────┘
                                           │
                        ┌──────────────────┼──────────────────┐
                        │                  │                  │
              ┌─────────▼───────┐ ┌────────▼────────┐ ┌──────▼───────┐
              │   PostgreSQL    │ │     Redis       │ │  AI Service  │
              │   (RDS/Aurora)  │ │  (ElastiCache)  │ │  (ECS/K8s)   │
              └─────────────────┘ └─────────────────┘ └──────────────┘
```

### Step 1: Build Production Assets

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build all packages and apps
pnpm build
```

### Step 2: Configure Production Environment

Create production environment files:

**apps/api/.env.production**
```env
# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=production

# Database (use managed PostgreSQL)
DATABASE_URL=postgresql://user:password@your-db-host:5432/erp_prod?sslmode=require

# Redis (use managed Redis)
REDIS_URL=redis://your-redis-host:6379

# JWT (use strong, unique secrets)
JWT_SECRET=<generate-with: openssl rand -base64 64>
JWT_REFRESH_SECRET=<generate-with: openssl rand -base64 64>

# License
LICENSE_ENCRYPTION_KEY=<generate-with: openssl rand -base64 32>

# CORS
CORS_ORIGIN=https://your-domain.com

# Rate Limiting
RATE_LIMIT_MAX=100

# AI Services (L2/L3)
AI_SERVICE_URL=http://ai-service:8000
OLLAMA_API_URL=http://ollama:11434

# Logging
LOG_LEVEL=info
```

### Step 3: Database Migration

```bash
# Run migrations (never use db:push in production)
pnpm db:migrate

# Verify migration status
npx prisma migrate status
```

### Step 4: Docker Production Build

**Dockerfile.api**
```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/packages/*/dist ./packages/
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma

EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
```

**Dockerfile.web**
```dockerfile
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @erp/web build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Step 5: Docker Compose Production

**docker-compose.prod.yml**
```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    environment:
      - NODE_ENV=production
    env_file:
      - apps/api/.env.production
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  ai-service:
    build:
      context: ./apps/ai-service
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    profiles:
      - ai
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### Step 6: Kubernetes Deployment (Recommended for Production)

**k8s/api-deployment.yaml**
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: erp-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: erp-api
  template:
    metadata:
      labels:
        app: erp-api
    spec:
      containers:
        - name: api
          image: your-registry/erp-api:latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: erp-api-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
```

### Step 7: CI/CD Pipeline

**GitHub Actions Example (.github/workflows/deploy.yml)**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm type-check
      - run: pnpm test

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and push Docker images
        run: |
          docker build -f Dockerfile.api -t your-registry/erp-api:${{ github.sha }} .
          docker build -f Dockerfile.web -t your-registry/erp-web:${{ github.sha }} .
          docker push your-registry/erp-api:${{ github.sha }}
          docker push your-registry/erp-web:${{ github.sha }}
      
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/erp-api api=your-registry/erp-api:${{ github.sha }}
          kubectl set image deployment/erp-web web=your-registry/erp-web:${{ github.sha }}
```

### Production Checklist

- [ ] **Security**
  - [ ] Use HTTPS with valid SSL certificates
  - [ ] Generate strong JWT secrets (64+ characters)
  - [ ] Enable rate limiting
  - [ ] Configure CORS for production domains
  - [ ] Set up WAF (Web Application Firewall)

- [ ] **Database**
  - [ ] Use managed PostgreSQL (RDS, Cloud SQL, etc.)
  - [ ] Enable SSL connections
  - [ ] Set up automated backups
  - [ ] Configure connection pooling

- [ ] **Monitoring**
  - [ ] Set up application monitoring (DataDog, New Relic)
  - [ ] Configure log aggregation (ELK, CloudWatch)
  - [ ] Set up alerting for errors and performance

- [ ] **Scaling**
  - [ ] Configure auto-scaling for API pods
  - [ ] Use CDN for static assets
  - [ ] Set up Redis clustering for high availability

- [ ] **Compliance**
  - [ ] Enable audit logging (L3)
  - [ ] Configure data retention policies
  - [ ] Set up regular security scans

---

## 📚 API Documentation

When running in development mode, API documentation is available at:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI Spec**: http://localhost:3000/docs/json

### Authentication

All API endpoints (except `/auth/*` and `/health`) require JWT authentication:

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@demo-company.com", "password": "password123"}'

# Use the access token
curl http://localhost:3000/api/v1/products \
  -H "Authorization: Bearer <access_token>"
```

### API Response Format

```typescript
{
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: object;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 🔐 Environment Variables

### API Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 3000 | API server port |
| `HOST` | No | 0.0.0.0 | API server host |
| `NODE_ENV` | Yes | development | Environment mode |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `REDIS_URL` | Yes | - | Redis connection string |
| `JWT_SECRET` | Yes | - | Access token secret (32+ chars) |
| `JWT_REFRESH_SECRET` | Yes | - | Refresh token secret (32+ chars) |
| `LICENSE_ENCRYPTION_KEY` | Yes | - | License key encryption (32+ chars) |
| `CORS_ORIGIN` | No | * | Allowed CORS origins |
| `RATE_LIMIT_MAX` | No | 100 | Requests per minute |
| `LOG_LEVEL` | No | info | Logging level |
| `AI_SERVICE_URL` | No | - | Python AI service URL (L2+) |
| `OLLAMA_API_URL` | No | - | Ollama API URL (L3) |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | Yes | - | Backend API URL |
| `VITE_APP_NAME` | No | ERP System | Application name |

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific package tests
pnpm --filter @erp/api test
pnpm --filter @erp/web test

# Run E2E tests
pnpm test:e2e
```

### Testing Stack

- **Unit Tests**: Vitest
- **Component Tests**: React Testing Library
- **API Tests**: Supertest
- **E2E Tests**: Playwright

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes following the code style guidelines
3. Write/update tests as needed
4. Run linting and tests: `pnpm lint && pnpm test`
5. Commit with conventional commits: `git commit -m "feat: add new feature"`
6. Push and create a Pull Request

### Commit Convention

- `feat:` New features
- `fix:` Bug fixes
- `refactor:` Code refactoring
- `docs:` Documentation updates
- `test:` Test updates
- `chore:` Maintenance tasks

---

## 📄 License

This project is proprietary software. All rights reserved.

For licensing inquiries, contact: sales@erp-system.com

---

## 📞 Support

- **Documentation**: [docs.erp-system.com](https://docs.erp-system.com)
- **Email Support**: support@erp-system.com
- **Issue Tracker**: [GitHub Issues](https://github.com/your-org/erp-system/issues)

---

<p align="center">
  Built with ❤️ using React, Fastify, and PostgreSQL
</p>


#   E R P - S y s t e m 
 
 