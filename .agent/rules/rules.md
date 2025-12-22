---
trigger: always_on
---

## Project Context

This ERP system is designed to be delivered as a **desktop application** using Electron. It is NOT intended for web deployment. All development, testing, and quality assurance must be performed with the desktop application as the target platform.

---

## 1. Desktop Application First

### Testing Requirements
- **Always test features using the desktop application** (Electron), not in a browser
- Run the development environment with: `pnpm dev` or the Electron-specific development command
- For production builds, use: `pnpm build` followed by the Electron packaging command
- Verify features work in the packaged desktop application, not just in development mode

### Development Workflow
- Consider desktop-specific features and limitations (e.g., file system access, native dialogs)
- Utilize Electron APIs when appropriate (e.g., `electron.dialog`, `electron.ipcRenderer`)
- Ensure window management and application lifecycle work correctly
- Test across different screen sizes and resolutions common for desktop applications

---

## 2. Production-Ready Code Only

### No Hardcoded Data in Frontend
❌ **NEVER DO THIS:**
```typescript
// Bad: Hardcoded data that bypasses the API
const currencies = [
  { id: 1, code: 'USD', name: 'US Dollar' },
  { id: 2, code: 'EUR', name: 'Euro' }
];
```

✅ **ALWAYS DO THIS:**
```typescript
// Good: Fetch data from the API
const currencies = await apiClient.currencies.getAll();
```

### API Integration Requirements
- **Frontend MUST call backend APIs** for all data operations (CRUD)
- **Backend API endpoints MUST be implemented** before frontend integration
- Do not use placeholder or mock data directly in production code
- All API calls should use the proper API client pattern established in the project
- Handle loading states, error states, and empty states properly

### Code Quality Standards
- Code must be production-ready, not just "working locally"
- Implement proper error handling and logging
- Use environment variables for configuration (via `.env` files)
- Ensure code works in both development and production builds
- Follow the project's established patterns and conventions

---

## 3. Mock Data Strategy

### Purpose of Mock Data
Mock data should serve two primary purposes:
1. **Enable development and testing** without requiring a live backend
2. **Validate API routes and integrations** work correctly

### Implementation Approach

#### Option A: Mock API Server (Recommended)
Create a separate mock API server that mimics the real backend:

```
apps/
  api/          # Real production API
  mock-api/     # Mock API server for testing
    src/
      routes/
        v1/
          currencies.ts    # Returns realistic mock data
          roles.ts
          ...
```

**Benefits:**
- Tests the actual HTTP request/response cycle
- Validates API routes are correctly configured
- Easy to exclude from production builds
- Can be toggled via environment variable

**Usage:**
```typescript
// .env.development
VITE_API_URL=http://localhost:3001  # Mock API

// .env.production
VITE_API_URL=https://api.yourcompany.com  # Real API
```

#### Option B: MSW (Mock Service Worker)
Use MSW to intercept API calls at the network level:

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/v1/currencies', (req, res, ctx) => {
    return res(
      ctx.json([
        { id: 1, code: 'USD', name: 'US Dollar' },
        { id: 2, code: 'EUR', name: 'Euro' }
      ])
    );
  }),
];
```

**Benefits:**
- Intercepts actual fetch/axios calls
- No code changes needed in the application
- Easy to enable/disable via environment variable
- Automatically excluded from production builds

**Setup:**
```typescript
// src/main.tsx
if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true') {
  const { worker } = await import('./mocks/browser');
  await worker.start();
}
```

### Mock Data Guidelines
1. **Keep mock data realistic** - Use data that reflects real-world scenarios
2. **Maintain mock data separately** - Store in `src/mocks/` or `apps/mock-api/`
3. **Use environment variables** - Control when mocks are active
4. **Mirror the real API structure** - Ensure response formats match exactly
5. **Version control mock data** - Include in git for team consistency
6. **Document mock scenarios** - Include edge cases (errors, empty data, etc.)

### Build Configuration
Ensure mock files are excluded from production builds:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        // Exclude mock-api if using separate server approach
        /^\/mock-api\//
      ]
    }
  },
  define: {
    // Remove mock code in production
    'import.meta.env.VITE_USE_MOCKS': JSON.stringify(false)
  }
});
```

---

## 4. API Development Workflow

### Step-by-Step Process
1. **Design the API endpoint** (define request/response structure)
2. **Implement the backend route** in `apps/api/src/routes/v1/`
3. **Create the frontend API client** in `apps/web/src/lib/api/`
4. **Set up mock data** (using MSW or mock-api server)
5. **Implement the frontend feature** using the API client
6. **Test with mock data** to validate integration
7. **Test with real API** to ensure production readiness
8. **Test in packaged desktop application** to verify final build

### Example: Adding a New Feature

```typescript
// 1. Backend API Route (apps/api/src/routes/v1/products.ts)
router.get('/products', async (req, res) => {
  const products = await db.products.findAll();
  res.json(products);
});

// 2. Frontend API Client (apps/web/src/lib/api/products.ts)
export const productsApi = {
  getAll: async () => {
    const response = await fetch(`${API_URL}/api/v1/products`);
    return response.json();
  }
};

// 3. Mock Data (apps/web/src/mocks/handlers.ts)
rest.get('/api/v1/products', (req, res, ctx) => {
  return res(ctx.json(mockProducts));
}),

// 4. Frontend Component
const ProductList = () => {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    productsApi.getAll().then(setProducts);
  }, []);
  
  return <div>{/* Render products */}</div>;
};
```

---

## 5. Testing Requirements

### Desktop Application Testing Checklist
- [ ] Feature works in Electron development mode
- [ ] Feature works in packaged Electron application
- [ ] API endpoints are implemented and functional
- [ ] Frontend properly calls backend APIs (no hardcoded data)
- [ ] Error handling works correctly
- [ ] Loading states display properly
- [ ] Empty states are handled gracefully
- [ ] Data persists correctly (if applicable)
- [ ] Desktop-specific features work (file dialogs, system notifications, etc.)

### API Testing
- [ ] All routes return correct status codes
- [ ] Response payloads match TypeScript interfaces
- [ ] Error responses are properly formatted
- [ ] Authentication/authorization works correctly
- [ ] Rate limiting is configured (if applicable)

---

## 6. Technology Constraints & Recommendations

### Current Tech Stack Assessment
Based on the project structure:
- ✅ **Electron** - Desktop application framework
- ✅ **React** - Frontend framework
- ✅ **Vite** - Build tool with excellent mock support
- ✅ **TypeScript** - Type safety across the stack
- ✅ **Express/Fastify** - Backend API framework

### Recommended Mock Strategy for This Project
Given your tech stack, I recommend **Mock Service Worker (MSW)** because:
1. ✅ No additional server to run
2. ✅ Works seamlessly with Vite
3. ✅ Automatically excluded from production builds
4. ✅ Tests actual API integration paths
5. ✅ Easy to toggle on/off via environment variable

### No Technical Limitations
**All of your requirements are fully achievable** with the current technology stack. There are no technical limitations preventing:
- Testing as a desktop application
- Writing production-ready code
- Using mock data that simulates real API calls
- Excluding mocks from production builds
- Validating API routes work correctly

---

## 7. Agent Instructions Summary

When developing features for this project, you (the AI agent) must:

1. **Always assume desktop application context** - Test and verify in Electron, not browser
2. **Implement full API integration** - Never use hardcoded data in frontend components
3. **Create backend endpoints first** - Before implementing frontend features
4. **Use proper mock data strategy** - Implement MSW or mock-api server
5. **Ensure production readiness** - Code must work in packaged application
6. **Test API routes** - Verify all endpoints are accessible and functional
7. **Follow the established patterns** - Use existing API client patterns
8. **Document API changes** - Keep API documentation up to date

### Red Flags to Avoid
🚫 Hardcoded data directly in React components  
🚫 Frontend-only implementations without backend  
🚫 Code that only works in `npm run dev`  
🚫 Mock data that can't be excluded from production  
🚫 Testing only in browser, not in Electron  
🚫 API routes that aren't implemented but referenced in frontend  

### Green Flags to Aim For
✅ Backend API endpoints implemented and tested  
✅ Frontend uses API clients to fetch data  
✅ Mock data uses MSW or separate mock server  
✅ Environment variables control mock usage  
✅ Features tested in packaged Electron app  
✅ Production build excludes all mock code  
✅ API integration tested and validated  

---

## 8. Implementation Checklist

Use this checklist for every new feature:

- [ ] **Backend Implementation**
  - [ ] API route created in `apps/api/src/routes/v1/`
  - [ ] Database models/queries implemented
  - [ ] Request validation added
  - [ ] Error handling implemented
  - [ ] API documented

- [ ] **Mock Data Setup**
  - [ ] Mock handlers created in `apps/web/src/mocks/handlers.ts`
  - [ ] Mock data mirrors real API response structure
  - [ ] Environment variable controls mock usage
  - [ ] Mock data includes edge cases

- [ ] **Frontend Implementation**
  - [ ] API client created in `apps/web/src/lib/api/`
  - [ ] TypeScript interfaces defined
  - [ ] Component uses API client (not hardcoded data)
  - [ ] Loading, error, and empty states handled

- [ ] **Testing & Validation**
  - [ ] Feature works with mock data
  - [ ] Feature works with real API
  - [ ] Tested in Electron development mode
  - [ ] Tested in packaged Electron application
  - [ ] Production build excludes mock code

---

## Conclusion

These rules ensure that:
1. ✅ The project is developed with **desktop application** as the primary target
2. ✅ All code is **production-ready** and not just locally functional
3. ✅ Mock data **simulates real API calls** for proper integration testing
4. ✅ Mock data is **easily manageable** and excluded from production builds
5. ✅ API routes are **tested and validated** during development

**There are NO technical limitations** preventing the implementation of these requirements. The current tech stack fully supports this development approach.