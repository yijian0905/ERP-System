#!/usr/bin/env node
/**
 * @file License Key Generation Script
 * @description Production CLI tool to generate and manage license keys for tenants
 * 
 * Usage:
 *   # Generate license for new tenant
 *   node generate-license.mjs --tenant-name "Company ABC" --tier L2 --months 12
 * 
 *   # Generate license for existing tenant
 *   node generate-license.mjs --tenant-id <uuid> --tier L1 --months 6
 * 
 *   # List all licenses
 *   node generate-license.mjs --list
 * 
 *   # Revoke a license
 *   node generate-license.mjs --revoke <license-key>
 */

import { randomBytes } from 'crypto';
import { parseArgs } from 'util';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, '../.env') });

// Import prisma from the database package
import { prisma } from '@erp/database';

// License key format: ERP-XXXX-XXXX-XXXX-XXXX
function generateLicenseKey() {
    const segments = [];
    for (let i = 0; i < 4; i++) {
        const bytes = randomBytes(2);
        segments.push(bytes.toString('hex').toUpperCase());
    }
    return `ERP-${segments.join('-')}`;
}

// Generate a unique slug from tenant name
function generateSlug(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50) + '-' + randomBytes(4).toString('hex');
}

// Parse command line arguments
function parseArguments() {
    try {
        const { values } = parseArgs({
            options: {
                'tenant-name': { type: 'string' },
                'tenant-id': { type: 'string' },
                'tier': { type: 'string', default: 'L1' },
                'months': { type: 'string', default: '12' },
                'max-users': { type: 'string', default: '5' },
                'list': { type: 'boolean', default: false },
                'revoke': { type: 'string' },
                'help': { type: 'boolean', default: false },
            },
            strict: true,
        });
        return values;
    } catch (error) {
        console.error('Error parsing arguments:', error.message);
        showHelp();
        process.exit(1);
    }
}

function showHelp() {
    console.log(`
License Key Generation Tool
===========================

Usage:
  node generate-license.mjs [options]

Options:
  --tenant-name <name>    Create new tenant with this name and generate license
  --tenant-id <uuid>      Generate license for existing tenant
  --tier <L1|L2|L3>       License tier (default: L1)
  --months <number>       License validity in months (default: 12)
  --max-users <number>    Maximum users allowed (default: 5)
  --list                  List all active licenses
  --revoke <key>          Revoke a license by key
  --help                  Show this help message

Examples:
  # Create new tenant and generate license
  node generate-license.mjs --tenant-name "Acme Corp" --tier L2 --months 12

  # Generate license for existing tenant
  node generate-license.mjs --tenant-id abc123... --tier L1 --months 6

  # List all licenses
  node generate-license.mjs --list
`);
}

// List all licenses
async function listLicenses() {
    const licenses = await prisma.license.findMany({
        include: {
            tenant: {
                select: {
                    name: true,
                    slug: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    if (licenses.length === 0) {
        console.log('No licenses found.');
        return;
    }

    console.log('\n=== Active Licenses ===\n');
    console.log('%-36s %-20s %-4s %-5s %-12s %-8s',
        'License Key', 'Tenant', 'Tier', 'Users', 'Expires', 'Active');
    console.log('-'.repeat(90));

    for (const license of licenses) {
        const expiresAt = license.expiresAt.toISOString().split('T')[0];
        const isExpired = license.expiresAt < new Date();
        const status = license.isActive ? (isExpired ? 'EXPIRED' : 'ACTIVE') : 'REVOKED';

        console.log(`${license.licenseKey}  ${license.tenant.name.substring(0, 18).padEnd(20)}  ${license.tier.padEnd(4)}  ${String(license.maxUsers).padEnd(5)}  ${expiresAt}  ${status}`);
    }
    console.log('\nTotal:', licenses.length, 'licenses');
}

// Revoke a license
async function revokeLicense(licenseKey) {
    const license = await prisma.license.findUnique({
        where: { licenseKey },
        include: { tenant: true },
    });

    if (!license) {
        console.error(`License not found: ${licenseKey}`);
        process.exit(1);
    }

    await prisma.license.update({
        where: { licenseKey },
        data: { isActive: false },
    });

    console.log(`\n✓ License revoked successfully`);
    console.log(`  Tenant: ${license.tenant.name}`);
    console.log(`  Key: ${licenseKey}`);
}

// Create new tenant
async function createTenant(name) {
    const slug = generateSlug(name);

    const tenant = await prisma.tenant.create({
        data: {
            name,
            slug,
            status: 'ACTIVE',
            tier: 'L1',
            settings: {},
        },
    });

    console.log(`\n✓ Created new tenant`);
    console.log(`  ID: ${tenant.id}`);
    console.log(`  Name: ${tenant.name}`);
    console.log(`  Slug: ${tenant.slug}`);

    return tenant;
}

// Generate license for tenant
async function generateLicense(tenantId, tier, months, maxUsers) {
    // Validate tenant exists
    const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
    });

    if (!tenant) {
        console.error(`Tenant not found: ${tenantId}`);
        process.exit(1);
    }

    // Check for existing active license
    const existingLicense = await prisma.license.findFirst({
        where: {
            tenantId,
            isActive: true,
        },
    });

    if (existingLicense) {
        console.log(`\n⚠ Warning: Tenant already has an active license`);
        console.log(`  Existing key: ${existingLicense.licenseKey}`);
        console.log(`  Expires: ${existingLicense.expiresAt.toISOString()}`);
        console.log(`  Deactivating old license...`);

        await prisma.license.update({
            where: { id: existingLicense.id },
            data: { isActive: false },
        });
    }

    // Generate new license
    const licenseKey = generateLicenseKey();
    const startsAt = new Date();
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + parseInt(months, 10));

    // Update tenant tier
    await prisma.tenant.update({
        where: { id: tenantId },
        data: { tier },
    });

    // Create license record
    const license = await prisma.license.create({
        data: {
            tenantId,
            licenseKey,
            tier,
            maxUsers: parseInt(maxUsers, 10),
            startsAt,
            expiresAt,
            isActive: true,
            features: getDefaultFeatures(tier),
        },
    });

    return { license, tenant };
}

// Get default features for tier
function getDefaultFeatures(tier) {
    const features = {
        L1: {
            modules: ['inventory', 'sales', 'purchasing', 'invoicing'],
            aiAnalytics: false,
            multiWarehouse: false,
            customReports: false,
        },
        L2: {
            modules: ['inventory', 'sales', 'purchasing', 'invoicing', 'einvoice', 'assets'],
            aiAnalytics: true,
            multiWarehouse: true,
            customReports: false,
        },
        L3: {
            modules: ['inventory', 'sales', 'purchasing', 'invoicing', 'einvoice', 'assets', 'forecasting', 'analytics'],
            aiAnalytics: true,
            multiWarehouse: true,
            customReports: true,
            advancedForecasting: true,
        },
    };

    return features[tier] || features.L1;
}

// Main function
async function main() {
    const args = parseArguments();

    if (args.help) {
        showHelp();
        process.exit(0);
    }

    try {
        // List licenses
        if (args.list) {
            await listLicenses();
            return;
        }

        // Revoke license
        if (args.revoke) {
            await revokeLicense(args.revoke);
            return;
        }

        // Validate tier
        const tier = args.tier?.toUpperCase();
        if (!['L1', 'L2', 'L3'].includes(tier)) {
            console.error('Invalid tier. Must be L1, L2, or L3');
            process.exit(1);
        }

        let tenantId = args['tenant-id'];

        // Create new tenant if name provided
        if (args['tenant-name']) {
            const tenant = await createTenant(args['tenant-name']);
            tenantId = tenant.id;
        }

        if (!tenantId) {
            console.error('Please provide either --tenant-name or --tenant-id');
            showHelp();
            process.exit(1);
        }

        // Generate license
        const { license, tenant } = await generateLicense(
            tenantId,
            tier,
            args.months,
            args['max-users']
        );

        console.log(`\n${'='.repeat(60)}`);
        console.log('✓ LICENSE GENERATED SUCCESSFULLY');
        console.log('='.repeat(60));
        console.log(`\n  Tenant:      ${tenant.name}`);
        console.log(`  Tenant ID:   ${tenant.id}`);
        console.log(`  Tier:        ${license.tier}`);
        console.log(`  Max Users:   ${license.maxUsers}`);
        console.log(`  Valid From:  ${license.startsAt.toISOString().split('T')[0]}`);
        console.log(`  Expires:     ${license.expiresAt.toISOString().split('T')[0]}`);
        console.log(`\n  LICENSE KEY: ${license.licenseKey}`);
        console.log(`\n${'='.repeat(60)}`);
        console.log('\nUse this license key to activate the desktop application.');
        console.log('API Server URL: http://localhost:3000 (or your production URL)');

    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
