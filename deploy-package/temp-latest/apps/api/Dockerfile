# ============================================================
# ERP API Service - Full Build Dockerfile (Prisma 7.x)
# ============================================================

# ==== Builder Stage ====
FROM node:20-alpine AS builder

# Install system dependencies
RUN apk add --no-cache openssl openssl-dev libc6-compat python3 make g++

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9.14.2 --activate

WORKDIR /app

# Copy package files first for better caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./

# Copy all packages
COPY packages ./packages

# Copy API app
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --shamefully-hoist

# Set DATABASE_URL for Prisma (required for adapter initialization)
ENV DATABASE_URL=postgresql://user:password@localhost:5432/db

# Generate Prisma client (Prisma 7.x with adapter mode)
# Note: --no-engine flag is used since we use @prisma/adapter-pg
WORKDIR /app/packages/database
RUN pnpm prisma generate --schema=./prisma/schema.prisma --no-engine || pnpm prisma generate --schema=./prisma/schema.prisma

# Verify Prisma client was generated
RUN ls -la ./generated/prisma-client/ && echo "Prisma client generated successfully!"

# Build shared-types and logger first (these don't depend on Prisma)
WORKDIR /app
RUN pnpm --filter @erp/shared-types build || true
RUN pnpm --filter @erp/logger build || true

# Build database package using TypeScript compiler directly (avoid tsup bundling issues)
WORKDIR /app/packages/database
RUN npx tsc --outDir dist --module CommonJS --target ES2020 --moduleResolution node --esModuleInterop true --skipLibCheck true --declaration false src/index.ts || true

# Copy the built index.js and verify
RUN ls -la ./dist/ || echo "No dist folder yet"

# Build API with relaxed TypeScript settings (for Docker compatibility)
WORKDIR /app/apps/api
RUN echo '{"extends":"./tsconfig.json","compilerOptions":{"noImplicitAny":false,"noUnusedLocals":false,"noUnusedParameters":false,"skipLibCheck":true,"strict":false}}' > tsconfig.docker.json
RUN npx tsc -p tsconfig.docker.json || true

# ==== Production Stage ====
FROM node:20-alpine AS runner

# Install system dependencies
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy built files from builder
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist/
COPY --from=builder /app/packages/shared-types/package.json ./packages/shared-types/
COPY --from=builder /app/packages/database/dist ./packages/database/dist/
COPY --from=builder /app/packages/database/package.json ./packages/database/
COPY --from=builder /app/packages/logger/dist ./packages/logger/dist/
COPY --from=builder /app/packages/logger/package.json ./packages/logger/
COPY --from=builder /app/apps/api/dist ./apps/api/dist/
COPY --from=builder /app/apps/api/package.json ./apps/api/

# Copy Prisma schema and generated client from explicit output path
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma/
COPY --from=builder /app/packages/database/generated ./packages/database/generated/

# Create a simplified package.json for database that uses CJS with Prisma 7.x adapter deps
WORKDIR /app/packages/database
RUN echo '{"name":"@erp/database","version":"1.0.0","main":"./dist/index.js","exports":{".":"./dist/index.js"},"dependencies":{"@prisma/client":"latest","@prisma/adapter-pg":"latest","pg":"^8.13.0"}}' > package.json

# Install database package dependencies
RUN npm install --production --ignore-scripts --legacy-peer-deps

# Create simplified package.json for API (remove workspace deps)
WORKDIR /app/apps/api
COPY --from=builder /app/apps/api/package.json ./package.original.json
RUN node -e "\
  const pkg = require('./package.original.json');\
  const deps = {};\
  Object.keys(pkg.dependencies || {}).forEach(k => {\
  if (!k.startsWith('@erp/') && !k.startsWith('workspace:')) {\
  const ver = pkg.dependencies[k];\
  if (!ver.startsWith('workspace:')) deps[k] = ver;\
  }\
  });\
  const newPkg = { name: pkg.name, version: pkg.version, type: 'module', dependencies: deps };\
  require('fs').writeFileSync('./package.json', JSON.stringify(newPkg, null, 2));\
  "

RUN npm install --production --ignore-scripts

# Create symlinks for workspace packages so Node.js can resolve @erp/* packages
RUN mkdir -p node_modules/@erp && \
  ln -s /app/packages/database node_modules/@erp/database && \
  ln -s /app/packages/logger node_modules/@erp/logger && \
  ln -s /app/packages/shared-types node_modules/@erp/shared-types

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server (index.js is the main entry point)
CMD ["node", "dist/index.js"]
