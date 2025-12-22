# ============================================================
# ERP API Service - NPM Only (No pnpm, No workspace)
# ============================================================

FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache openssl openssl-dev libc6-compat

WORKDIR /app

# === Strategy: Use npm, not pnpm ===
# This avoids all pnpm workspace magic that triggers builds

# First, install Prisma CLI globally
RUN npm install -g prisma@latest

# Copy database package and generate Prisma client
COPY packages/database/package.json ./packages/database/
COPY packages/database/prisma ./packages/database/prisma/
WORKDIR /app/packages/database
# Install @prisma/client WITHOUT --ignore-scripts to allow postinstall
RUN npm install @prisma/client
RUN prisma generate

# Go back to app root
WORKDIR /app

# Copy pre-built dist directories (this is the key!)
COPY packages/shared-types/dist ./packages/shared-types/dist/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/database/dist ./packages/database/dist/
COPY packages/logger/dist ./packages/logger/dist/
COPY packages/logger/package.json ./packages/logger/

# Copy API pre-built files
COPY apps/api/dist ./apps/api/dist/
COPY apps/api/package.json ./apps/api/

# Create a simple package.json for npm install
WORKDIR /app/apps/api
RUN node -e " \
    const pkg = require('./package.json'); \
    const newPkg = { \
    name: pkg.name, \
    version: pkg.version, \
    type: 'module', \
    dependencies: {} \
    }; \
    Object.keys(pkg.dependencies || {}).forEach(k => { \
    if (!k.startsWith('@erp/')) { \
    newPkg.dependencies[k] = pkg.dependencies[k]; \
    } \
    }); \
    require('fs').writeFileSync('./package.json', JSON.stringify(newPkg, null, 2)); \
    "

# Install only external dependencies (not workspace packages)
RUN npm install --production --ignore-scripts

# Copy the generated Prisma Client from database package to node_modules
RUN cp -r /app/packages/database/node_modules/.prisma ./node_modules/.prisma || true
RUN cp -r /app/packages/database/node_modules/@prisma ./node_modules/@prisma || true

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the pre-built server
CMD ["node", "dist/server.js"]
