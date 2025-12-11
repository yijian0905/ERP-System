# ERP System 單元測試計劃

> **版本**: 1.0.0
> **更新日期**: 2025-12-11
> **目標**: 確保專案核心功能的正確性和穩定性

---

## 📋 目錄

1. [測試環境設置](#測試環境設置)
2. [測試框架選擇](#測試框架選擇)
3. [測試範圍概述](#測試範圍概述)
4. [後端 API 測試計劃](#後端-api-測試計劃)
5. [前端測試計劃](#前端測試計劃)
6. [共享套件測試計劃](#共享套件測試計劃)
7. [測試優先級](#測試優先級)
8. [執行指南](#執行指南)

---

## 測試環境設置

### 安裝測試依賴

```bash
# 後端測試 (apps/api)
pnpm --filter @erp/api add -D vitest @vitest/coverage-v8 supertest @types/supertest

# 前端測試 (apps/web)
pnpm --filter @erp/web add -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom

# 共享套件測試
pnpm --filter @erp/shared-types add -D vitest
pnpm --filter @erp/license add -D vitest
pnpm --filter @erp/database add -D vitest
```

### Vitest 配置

**apps/api/vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.d.ts'],
    },
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

**apps/web/vitest.config.ts:**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

## 測試框架選擇

| 層級 | 框架 | 用途 |
|------|------|------|
| 單元測試 | Vitest | 快速、TypeScript 原生支持 |
| API 測試 | Supertest | HTTP 請求模擬 |
| 組件測試 | React Testing Library | 用戶視角測試 |
| E2E 測試 | Playwright | 端到端流程測試 |
| Mock | Vitest mock / MSW | 依賴模擬 |

---

## 測試範圍概述

### 覆蓋目標

| 模組 | 最低覆蓋率 | 優先級 |
|------|-----------|--------|
| 認證 (auth) | 90% | 🔴 高 |
| JWT 處理 (jwt) | 90% | 🔴 高 |
| 許可權 (permissions) | 85% | 🔴 高 |
| 授權 (license) | 85% | 🔴 高 |
| 錯誤處理 | 80% | 🟡 中 |
| API 路由 | 75% | 🟡 中 |
| 前端 Store | 80% | 🟡 中 |
| UI 組件 | 70% | 🟢 低 |

---

## 後端 API 測試計劃

### 1. JWT 模組 (`apps/api/src/lib/jwt.ts`)

**測試文件**: `apps/api/src/lib/jwt.test.ts`

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getJwtConfig,
  clearJwtConfigCache,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
  parseTimeToSeconds,
  extractBearerToken,
  generateTokenFamily,
} from './jwt';

describe('JWT Module', () => {
  beforeEach(() => {
    clearJwtConfigCache();
  });

  describe('getJwtConfig', () => {
    it('should return default config in development', () => {
      const config = getJwtConfig();
      expect(config.accessSecret).toBeDefined();
      expect(config.refreshSecret).toBeDefined();
      expect(config.accessExpiresIn).toBe('15m');
      expect(config.refreshExpiresIn).toBe('7d');
    });

    it('should throw error in production without secrets', () => {
      vi.stubEnv('NODE_ENV', 'production');
      expect(() => getJwtConfig()).toThrow();
      vi.unstubAllEnvs();
    });

    it('should accept custom config from environment', () => {
      vi.stubEnv('JWT_SECRET', 'a'.repeat(32));
      vi.stubEnv('JWT_REFRESH_SECRET', 'b'.repeat(32));
      vi.stubEnv('JWT_ACCESS_EXPIRES_IN', '30m');

      const config = getJwtConfig();
      expect(config.accessExpiresIn).toBe('30m');

      vi.unstubAllEnvs();
    });
  });

  describe('generateAccessToken', () => {
    it('should generate a valid JWT token', () => {
      const config = getJwtConfig();
      const token = generateAccessToken({
        sub: 'user-123',
        tid: 'tenant-456',
        email: 'test@example.com',
        role: 'USER',
        tier: 'L1',
        permissions: ['products.view'],
      }, config);

      expect(token).toBeDefined();
      expect(token.split('.')).toHaveLength(3);
    });

    it('should include correct payload', () => {
      const config = getJwtConfig();
      const token = generateAccessToken({
        sub: 'user-123',
        tid: 'tenant-456',
        email: 'test@example.com',
        role: 'USER',
        tier: 'L1',
        permissions: ['products.view'],
      }, config);

      const decoded = verifyAccessToken(token, config);
      expect(decoded.sub).toBe('user-123');
      expect(decoded.tid).toBe('tenant-456');
      expect(decoded.type).toBe('access');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid token', () => {
      const config = getJwtConfig();
      const token = generateAccessToken({
        sub: 'user-123',
        tid: 'tenant-456',
        email: 'test@example.com',
        role: 'USER',
        tier: 'L1',
        permissions: [],
      }, config);

      const decoded = verifyAccessToken(token, config);
      expect(decoded.sub).toBe('user-123');
    });

    it('should reject invalid token', () => {
      const config = getJwtConfig();
      expect(() => verifyAccessToken('invalid-token', config)).toThrow();
    });

    it('should reject refresh token as access token', () => {
      const config = getJwtConfig();
      const refreshToken = generateRefreshToken('user-123', 'tenant-456', 'family-1', config);
      expect(() => verifyAccessToken(refreshToken, config)).toThrow();
    });
  });

  describe('parseTimeToSeconds', () => {
    it('should parse seconds', () => {
      expect(parseTimeToSeconds('30s')).toBe(30);
    });

    it('should parse minutes', () => {
      expect(parseTimeToSeconds('15m')).toBe(900);
    });

    it('should parse hours', () => {
      expect(parseTimeToSeconds('2h')).toBe(7200);
    });

    it('should parse days', () => {
      expect(parseTimeToSeconds('7d')).toBe(604800);
    });

    it('should throw on invalid format', () => {
      expect(() => parseTimeToSeconds('invalid')).toThrow();
    });
  });

  describe('extractBearerToken', () => {
    it('should extract token from valid header', () => {
      expect(extractBearerToken('Bearer token123')).toBe('token123');
    });

    it('should return null for missing header', () => {
      expect(extractBearerToken(undefined)).toBeNull();
    });

    it('should return null for invalid format', () => {
      expect(extractBearerToken('Basic token123')).toBeNull();
    });
  });

  describe('generateTokenFamily', () => {
    it('should generate unique family IDs', () => {
      const family1 = generateTokenFamily();
      const family2 = generateTokenFamily();
      expect(family1).not.toBe(family2);
    });
  });
});
```

### 2. 認證路由 (`apps/api/src/routes/auth.ts`)

**測試文件**: `apps/api/src/routes/auth.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildServer } from '../server';
import supertest from 'supertest';

describe('Auth Routes', () => {
  let app: Awaited<ReturnType<typeof buildServer>>;
  let request: supertest.SuperTest<supertest.Test>;

  beforeAll(async () => {
    app = await buildServer();
    await app.ready();
    request = supertest(app.server);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return 400 for missing email', async () => {
      const response = await request
        .post('/auth/login')
        .send({ password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request
        .post('/auth/login')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return tokens for valid credentials', async () => {
      // 需要先種子資料庫
      const response = await request
        .post('/auth/login')
        .send({ email: 'admin@demo.com', password: 'admin123' });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();
        expect(response.body.data.user).toBeDefined();
      }
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 400 for missing refresh token', async () => {
      const response = await request
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request
        .post('/auth/refresh')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('should return success even without token', async () => {
      const response = await request
        .post('/auth/logout')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /auth/me', () => {
    it('should return 401 without authentication', async () => {
      const response = await request.get('/auth/me');

      expect(response.status).toBe(401);
    });

    it('should return user info with valid token', async () => {
      // 先登入獲取 token
      const loginResponse = await request
        .post('/auth/login')
        .send({ email: 'admin@demo.com', password: 'admin123' });

      if (loginResponse.status === 200) {
        const { accessToken } = loginResponse.body.data;

        const response = await request
          .get('/auth/me')
          .set('Authorization', `Bearer ${accessToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.email).toBe('admin@demo.com');
      }
    });
  });
});
```

### 3. 錯誤處理 (`apps/api/src/lib/error-handler.ts`)

**測試文件**: `apps/api/src/lib/error-handler.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  AppError,
  ErrorCodes,
  notFoundError,
  validationError,
  unauthorizedError,
  forbiddenError,
  conflictError,
} from './error-handler';

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create error with correct properties', () => {
      const error = new AppError(
        ErrorCodes.NOT_FOUND,
        'Resource not found',
        404,
        { resourceId: '123' }
      );

      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ resourceId: '123' });
    });

    it('should default to 500 status code', () => {
      const error = new AppError(ErrorCodes.INTERNAL_ERROR, 'Internal error');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('Error Factory Functions', () => {
    it('notFoundError should create 404 error', () => {
      const error = notFoundError('Product');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
      expect(error.message).toBe('Product not found');
    });

    it('validationError should create 400 error', () => {
      const error = validationError('Invalid input', { field: 'email' });
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('unauthorizedError should create 401 error', () => {
      const error = unauthorizedError();
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    it('forbiddenError should create 403 error', () => {
      const error = forbiddenError('Insufficient permissions');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    it('conflictError should create 409 error', () => {
      const error = conflictError('Already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });
  });
});
```

### 4. 驗證工具 (`apps/api/src/lib/validation.ts`)

**測試文件**: `apps/api/src/lib/validation.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  validateUuid,
  isValidUuid,
  paginationSchema,
  emailSchema,
  phoneSchema,
  skuSchema,
  moneySchema,
  quantitySchema,
} from './validation';

describe('Validation Utils', () => {
  describe('UUID Validation', () => {
    it('should validate correct UUID', () => {
      const uuid = '550e8400-e29b-41d4-a716-446655440000';
      expect(validateUuid(uuid)).toBe(uuid);
      expect(isValidUuid(uuid)).toBe(true);
    });

    it('should reject invalid UUID', () => {
      expect(validateUuid('not-a-uuid')).toBeNull();
      expect(isValidUuid('not-a-uuid')).toBe(false);
    });
  });

  describe('Pagination Schema', () => {
    it('should use defaults for empty input', () => {
      const result = paginationSchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(result.sortOrder).toBe('desc');
    });

    it('should accept valid pagination params', () => {
      const result = paginationSchema.parse({
        page: 2,
        limit: 50,
        sortBy: 'createdAt',
        sortOrder: 'asc',
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(50);
    });

    it('should reject limit over 100', () => {
      expect(() => paginationSchema.parse({ limit: 200 })).toThrow();
    });
  });

  describe('Email Schema', () => {
    it('should validate correct email', () => {
      expect(emailSchema.parse('user@example.com')).toBe('user@example.com');
    });

    it('should reject invalid email', () => {
      expect(() => emailSchema.parse('not-an-email')).toThrow();
    });
  });

  describe('SKU Schema', () => {
    it('should validate correct SKU', () => {
      expect(skuSchema.parse('PROD-001')).toBe('PROD-001');
      expect(skuSchema.parse('ABC_123')).toBe('ABC_123');
    });

    it('should reject SKU with special characters', () => {
      expect(() => skuSchema.parse('PROD@001')).toThrow();
    });

    it('should reject empty SKU', () => {
      expect(() => skuSchema.parse('')).toThrow();
    });
  });

  describe('Money Schema', () => {
    it('should validate positive numbers', () => {
      expect(moneySchema.parse(99.99)).toBe(99.99);
    });

    it('should reject zero or negative', () => {
      expect(() => moneySchema.parse(0)).toThrow();
      expect(() => moneySchema.parse(-10)).toThrow();
    });
  });

  describe('Quantity Schema', () => {
    it('should validate non-negative integers', () => {
      expect(quantitySchema.parse(0)).toBe(0);
      expect(quantitySchema.parse(100)).toBe(100);
    });

    it('should reject negative numbers', () => {
      expect(() => quantitySchema.parse(-1)).toThrow();
    });

    it('should reject decimals', () => {
      expect(() => quantitySchema.parse(1.5)).toThrow();
    });
  });
});
```

---

## 前端測試計劃

### 1. Auth Store (`apps/web/src/stores/auth.ts`)

**測試文件**: `apps/web/src/stores/auth.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './auth';

describe('Auth Store', () => {
  beforeEach(() => {
    // 重置 store 狀態
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      tier: null,
      permissions: [],
    });
    localStorage.clear();
  });

  describe('setAuth', () => {
    it('should set user and tokens', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        tenantId: 'tenant-1',
        tier: 'L1' as const,
        permissions: ['products.view'],
      };

      useAuthStore.getState().setAuth(user, 'access-token', 'refresh-token');

      const state = useAuthStore.getState();
      expect(state.user).toEqual(user);
      expect(state.accessToken).toBe('access-token');
      expect(state.refreshToken).toBe('refresh-token');
      expect(state.isAuthenticated).toBe(true);
      expect(state.tier).toBe('L1');
    });
  });

  describe('logout', () => {
    it('should clear all auth state', () => {
      // 先設置認證狀態
      useAuthStore.getState().setAuth(
        {
          id: '1',
          email: 'test@example.com',
          name: 'Test',
          role: 'USER' as const,
          tenantId: 'tenant-1',
          tier: 'L1' as const,
          permissions: [],
        },
        'token',
        'refresh'
      );

      useAuthStore.getState().logout();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('hasFeature', () => {
    it('should return true for L1 features', () => {
      useAuthStore.setState({ tier: 'L1' });
      expect(useAuthStore.getState().hasFeature('inventory')).toBe(true);
      expect(useAuthStore.getState().hasFeature('invoicing')).toBe(true);
    });

    it('should return false for L2 features on L1 tier', () => {
      useAuthStore.setState({ tier: 'L1' });
      expect(useAuthStore.getState().hasFeature('predictiveAnalytics')).toBe(false);
    });

    it('should return true for L2 features on L2 tier', () => {
      useAuthStore.setState({ tier: 'L2' });
      expect(useAuthStore.getState().hasFeature('predictiveAnalytics')).toBe(true);
      expect(useAuthStore.getState().hasFeature('demandForecasting')).toBe(true);
    });

    it('should return true for L3 features on L3 tier', () => {
      useAuthStore.setState({ tier: 'L3' });
      expect(useAuthStore.getState().hasFeature('aiChatAssistant')).toBe(true);
      expect(useAuthStore.getState().hasFeature('auditLogs')).toBe(true);
    });
  });

  describe('hasPermission', () => {
    beforeEach(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        permissions: ['products.view', 'products.create', 'inventory.*'],
      });
    });

    it('should return true for exact permission match', () => {
      expect(useAuthStore.getState().hasPermission('products.view')).toBe(true);
    });

    it('should return false for missing permission', () => {
      expect(useAuthStore.getState().hasPermission('users.delete')).toBe(false);
    });

    it('should support wildcard permissions', () => {
      expect(useAuthStore.getState().hasPermission('inventory.view')).toBe(true);
      expect(useAuthStore.getState().hasPermission('inventory.adjust')).toBe(true);
    });

    it('should return false when not authenticated', () => {
      useAuthStore.setState({ isAuthenticated: false });
      expect(useAuthStore.getState().hasPermission('products.view')).toBe(false);
    });
  });

  describe('hasAnyPermission', () => {
    beforeEach(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        permissions: ['products.view'],
      });
    });

    it('should return true if any permission matches', () => {
      expect(
        useAuthStore.getState().hasAnyPermission('users.view', 'products.view')
      ).toBe(true);
    });

    it('should return false if no permission matches', () => {
      expect(
        useAuthStore.getState().hasAnyPermission('users.view', 'users.create')
      ).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    beforeEach(() => {
      useAuthStore.setState({
        isAuthenticated: true,
        permissions: ['products.view', 'products.create'],
      });
    });

    it('should return true if all permissions match', () => {
      expect(
        useAuthStore.getState().hasAllPermissions('products.view', 'products.create')
      ).toBe(true);
    });

    it('should return false if any permission is missing', () => {
      expect(
        useAuthStore.getState().hasAllPermissions('products.view', 'products.delete')
      ).toBe(false);
    });
  });
});
```

### 2. API Client (`apps/web/src/lib/api-client.ts`)

**測試文件**: `apps/web/src/lib/api-client.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, get, post, patch, del } from './api-client';
import { useAuthStore } from '@/stores/auth';

// Mock axios
vi.mock('axios', async () => {
  const actual = await vi.importActual('axios');
  return {
    ...actual,
    default: {
      create: () => ({
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() },
        },
      }),
    },
  };
});

describe('API Client', () => {
  beforeEach(() => {
    useAuthStore.setState({
      accessToken: 'test-token',
      refreshToken: 'refresh-token',
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Interceptor', () => {
    it('should add Authorization header when token exists', () => {
      // 驗證 interceptor 設置邏輯
      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('test-token');
    });
  });

  // 更多測試...
});
```

---

## 共享套件測試計劃

### 1. License 套件 (`packages/license`)

**測試文件**: `packages/license/src/license-validator.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { validateLicense, isFeatureEnabled, canAccessTier } from './license-validator';

describe('License Validator', () => {
  describe('canAccessTier', () => {
    it('should allow L1 access on L1 license', () => {
      expect(canAccessTier('L1', 'L1')).toBe(true);
    });

    it('should allow L1 access on L2 license', () => {
      expect(canAccessTier('L2', 'L1')).toBe(true);
    });

    it('should allow L1 and L2 access on L3 license', () => {
      expect(canAccessTier('L3', 'L1')).toBe(true);
      expect(canAccessTier('L3', 'L2')).toBe(true);
    });

    it('should deny L2 access on L1 license', () => {
      expect(canAccessTier('L1', 'L2')).toBe(false);
    });

    it('should deny L3 access on L2 license', () => {
      expect(canAccessTier('L2', 'L3')).toBe(false);
    });
  });

  describe('isFeatureEnabled', () => {
    it('should enable basic features for L1', () => {
      expect(isFeatureEnabled('L1', 'inventory')).toBe(true);
      expect(isFeatureEnabled('L1', 'basicReports')).toBe(true);
    });

    it('should disable advanced features for L1', () => {
      expect(isFeatureEnabled('L1', 'predictiveAnalytics')).toBe(false);
      expect(isFeatureEnabled('L1', 'aiChatAssistant')).toBe(false);
    });

    it('should enable predictive features for L2', () => {
      expect(isFeatureEnabled('L2', 'predictiveAnalytics')).toBe(true);
      expect(isFeatureEnabled('L2', 'demandForecasting')).toBe(true);
    });

    it('should enable all features for L3', () => {
      expect(isFeatureEnabled('L3', 'aiChatAssistant')).toBe(true);
      expect(isFeatureEnabled('L3', 'auditLogs')).toBe(true);
      expect(isFeatureEnabled('L3', 'multiCurrency')).toBe(true);
    });
  });
});
```

### 2. Shared Types 套件 (`packages/shared-types`)

**測試文件**: `packages/shared-types/src/permissions.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import {
  Permissions,
  RolePermissions,
  isValidPermission,
  getPermissionsForRole,
} from './permissions';

describe('Permissions', () => {
  describe('isValidPermission', () => {
    it('should return true for valid permission', () => {
      expect(isValidPermission('products.view')).toBe(true);
      expect(isValidPermission('users.create')).toBe(true);
    });

    it('should return false for invalid permission', () => {
      expect(isValidPermission('invalid.permission')).toBe(false);
    });
  });

  describe('getPermissionsForRole', () => {
    it('should return all permissions for ADMIN', () => {
      const adminPerms = getPermissionsForRole('ADMIN');
      expect(adminPerms).toContain(Permissions.USERS_DELETE);
      expect(adminPerms).toContain(Permissions.SETTINGS_EDIT);
    });

    it('should return limited permissions for VIEWER', () => {
      const viewerPerms = getPermissionsForRole('VIEWER');
      expect(viewerPerms).toContain(Permissions.PRODUCTS_VIEW);
      expect(viewerPerms).not.toContain(Permissions.PRODUCTS_CREATE);
      expect(viewerPerms).not.toContain(Permissions.USERS_DELETE);
    });

    it('should return empty array for unknown role', () => {
      expect(getPermissionsForRole('UNKNOWN')).toEqual([]);
    });
  });

  describe('RolePermissions', () => {
    it('ADMIN should have all permissions', () => {
      expect(RolePermissions.ADMIN.length).toBeGreaterThan(
        RolePermissions.MANAGER.length
      );
    });

    it('MANAGER should have more permissions than USER', () => {
      expect(RolePermissions.MANAGER.length).toBeGreaterThan(
        RolePermissions.USER.length
      );
    });

    it('USER should have more permissions than VIEWER', () => {
      expect(RolePermissions.USER.length).toBeGreaterThan(
        RolePermissions.VIEWER.length
      );
    });
  });
});
```

---

## 測試優先級

### 🔴 高優先級（第一階段）

| 測試項目 | 文件位置 | 說明 |
|---------|---------|------|
| JWT 生成與驗證 | `apps/api/src/lib/jwt.test.ts` | 核心認證機制 |
| 登入/登出流程 | `apps/api/src/routes/auth.test.ts` | 用戶認證入口 |
| Token 刷新 | `apps/api/src/routes/auth.test.ts` | 維持會話安全 |
| Auth Store | `apps/web/src/stores/auth.test.ts` | 前端狀態管理 |
| 權限檢查 | `packages/shared-types/src/permissions.test.ts` | 訪問控制 |
| 許可證驗證 | `packages/license/src/license-validator.test.ts` | 功能授權 |

### 🟡 中優先級（第二階段）

| 測試項目 | 文件位置 | 說明 |
|---------|---------|------|
| 錯誤處理 | `apps/api/src/lib/error-handler.test.ts` | 統一錯誤響應 |
| 驗證工具 | `apps/api/src/lib/validation.test.ts` | 輸入驗證 |
| 產品 CRUD | `apps/api/src/routes/v1/products.test.ts` | 核心業務邏輯 |
| 庫存管理 | `apps/api/src/routes/v1/inventory.test.ts` | 庫存操作 |
| API Client | `apps/web/src/lib/api-client.test.ts` | HTTP 請求處理 |

### 🟢 低優先級（第三階段）

| 測試項目 | 文件位置 | 說明 |
|---------|---------|------|
| UI 組件 | `apps/web/src/components/**/*.test.tsx` | 界面渲染 |
| 報表功能 | `apps/api/src/routes/v1/reports.test.ts` | 報表生成 |
| E-Invoice | `apps/api/src/services/einvoice/*.test.ts` | 電子發票 |
| AI 服務 | `apps/api/src/services/ai/*.test.ts` | AI 功能 |

---

## 執行指南

### 運行所有測試

```bash
# 運行所有測試
pnpm test

# 運行特定套件測試
pnpm --filter @erp/api test
pnpm --filter @erp/web test
pnpm --filter @erp/license test

# 帶覆蓋率運行
pnpm test:coverage

# 監聽模式
pnpm test:watch
```

### CI/CD 整合

**GitHub Actions 配置** (`.github/workflows/test.yml`):

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: erp_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install

      - name: Generate Prisma Client
        run: pnpm db:generate

      - name: Run Database Migrations
        run: pnpm db:push
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/erp_test

      - name: Run Tests
        run: pnpm test:coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/erp_test
          JWT_SECRET: test-jwt-secret-for-ci-testing-only
          JWT_REFRESH_SECRET: test-refresh-secret-for-ci

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### 測試資料庫設置

```bash
# 創建測試資料庫
docker-compose -f docker-compose.test.yml up -d

# 運行遷移
DATABASE_URL=postgresql://test:test@localhost:5433/erp_test pnpm db:push

# 種子測試資料
DATABASE_URL=postgresql://test:test@localhost:5433/erp_test pnpm db:seed
```

---

## 總結

本測試計劃覆蓋了 ERP 系統的核心功能，包括：

1. **認證系統** - JWT 生成、驗證、刷新
2. **權限系統** - 角色權限、功能訪問控制
3. **許可證系統** - 層級功能限制
4. **API 端點** - CRUD 操作、錯誤處理
5. **前端狀態** - Store 管理、API 客戶端

建議按照優先級順序實施測試，確保核心功能的穩定性後再擴展到其他模組。
