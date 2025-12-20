/**
 * @file ERP System License Generator
 * @description Cross-platform license key generator for Windows/Mac/Linux
 * 
 * Usage:
 *   node scripts/generate-license.mjs --tier L2 --tenant-id <uuid> [options]
 * 
 * Options:
 *   --tier       License tier: L1, L2, L3 (required)
 *   --tenant-id  Tenant UUID (optional, will generate if not provided)
 *   --max-users  Maximum users (default: tier-based)
 *   --expires    Expiration date YYYY-MM-DD (default: 1 year)
 *   --output     Output format: json, key (default: key)
 */

import crypto from 'crypto';

// Tier configurations
const TIER_CONFIG = {
    L1: {
        maxUsers: 5,
        features: {
            inventory: true,
            orders: true,
            invoices: true,
            reports_basic: true,
        }
    },
    L2: {
        maxUsers: 25,
        features: {
            inventory: true,
            orders: true,
            invoices: true,
            reports_basic: true,
            reports_advanced: true,
            predictions: true,
            multi_warehouse: true,
        }
    },
    L3: {
        maxUsers: 999,
        features: {
            inventory: true,
            orders: true,
            invoices: true,
            reports_basic: true,
            reports_advanced: true,
            predictions: true,
            multi_warehouse: true,
            ai_assistant: true,
            audit_logs: true,
            api_access: true,
        }
    }
};

function generateUUID() {
    return crypto.randomUUID();
}

function generateLicenseKey(payload) {
    const payloadJson = JSON.stringify(payload);
    const payloadB64 = Buffer.from(payloadJson).toString('base64url');
    const hash = crypto.createHash('sha256').update(payloadB64).digest('hex');

    // Create a readable license key format
    const keyParts = [
        'ERP',
        payload.tier,
        payloadB64.substring(0, 20),
        hash.substring(0, 16)
    ];

    return keyParts.join('-');
}

function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        tier: '',
        tenantId: '',
        maxUsers: 0,
        expires: '',
        output: 'key'
    };

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];

        if (arg === '--tier' && nextArg) {
            options.tier = nextArg.toUpperCase();
            i++;
        } else if (arg === '--tenant-id' && nextArg) {
            options.tenantId = nextArg;
            i++;
        } else if (arg === '--max-users' && nextArg) {
            options.maxUsers = parseInt(nextArg, 10);
            i++;
        } else if (arg === '--expires' && nextArg) {
            options.expires = nextArg;
            i++;
        } else if (arg === '--output' && nextArg) {
            options.output = nextArg;
            i++;
        } else if (arg === '--help' || arg === '-h') {
            printUsage();
            process.exit(0);
        }
    }

    return options;
}

function printUsage() {
    console.log(`
ERP System License Generator
=============================

Usage:
  node scripts/generate-license.mjs --tier <tier> [options]

Required:
  --tier <L1|L2|L3>     License tier

Options:
  --tenant-id <uuid>    Tenant UUID (generates if not provided)
  --max-users <number>  Maximum users (default: tier-based)
  --expires <date>      Expiration date YYYY-MM-DD (default: 1 year)
  --output <format>     Output format: json, key (default: key)
  -h, --help            Show this help

Examples:
  node scripts/generate-license.mjs --tier L2
  node scripts/generate-license.mjs --tier L3 --max-users 100 --expires 2025-12-31
  node scripts/generate-license.mjs --tier L1 --tenant-id abc-123 --output json
`);
}

function main() {
    const options = parseArgs();

    // Validate tier
    if (!options.tier || !TIER_CONFIG[options.tier]) {
        console.error('Error: Valid tier is required (L1, L2, or L3)');
        printUsage();
        process.exit(1);
    }

    const tierConfig = TIER_CONFIG[options.tier];

    // Generate or use provided values
    const licenseId = generateUUID();
    const tenantId = options.tenantId || generateUUID();
    const maxUsers = options.maxUsers || tierConfig.maxUsers;

    // Calculate expiration (default: 1 year from now)
    const now = new Date();
    let expiresAt;
    if (options.expires) {
        expiresAt = new Date(options.expires + 'T23:59:59Z');
    } else {
        expiresAt = new Date(now);
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    }

    const payload = {
        license_id: licenseId,
        tenant_id: tenantId,
        tier: options.tier,
        max_users: maxUsers,
        features: tierConfig.features,
        issued_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
        issuer: 'erp-system'
    };

    const licenseKey = generateLicenseKey(payload);

    if (options.output === 'json') {
        console.log(JSON.stringify({
            ...payload,
            license_key: licenseKey
        }, null, 2));
    } else {
        console.log('\n╔════════════════════════════════════════════════════════════╗');
        console.log('║           License Generated Successfully! 🔑               ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        console.log('License Details:');
        console.log('┌─────────────────────────────────────────────────────────────┐');
        console.log(`│ License ID: ${licenseId}`);
        console.log(`│ Tenant ID:  ${tenantId}`);
        console.log(`│ Tier:       ${options.tier}`);
        console.log(`│ Max Users:  ${maxUsers}`);
        console.log(`│ Issued:     ${now.toISOString()}`);
        console.log(`│ Expires:    ${expiresAt.toISOString()}`);
        console.log('└─────────────────────────────────────────────────────────────┘\n');

        console.log('License Key:');
        console.log(`\x1b[36m${licenseKey}\x1b[0m\n`);

        console.log('Features:');
        Object.entries(tierConfig.features).forEach(([feature, enabled]) => {
            console.log(`  ${enabled ? '✓' : '✗'} ${feature}`);
        });
        console.log('\n');
    }
}

main();
