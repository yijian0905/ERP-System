import path from 'node:path';
import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

// Database URL from environment variable
const databaseUrl = process.env.DATABASE_URL || 'postgresql://erp_user:erp_password@localhost:5432/erp_database';

// Create connection pool for migrations
const pool = new Pool({
    connectionString: databaseUrl,
});

// Create adapter
const adapter = new PrismaPg(pool);

export default defineConfig({
    earlyAccess: true,
    schema: path.join(__dirname, 'schema.prisma'),

    // Migration configuration
    migrate: {
        adapter: async () => adapter,
    },

    // Studio configuration
    studio: {
        adapter: async () => adapter,
    },
});
