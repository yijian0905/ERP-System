/**
 * @file Production Build Script
 * @description Builds the complete desktop application package
 *
 * Per spec.md and prompt.md:
 * - Build web app first
 * - Copy web app build to dist/renderer
 * - Build electron main/preload
 * - Package with electron-builder
 *
 * Usage: node scripts/build-desktop.mjs [--package]
 */

import { execSync } from 'child_process';
import { cpSync, rmSync, existsSync, mkdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = resolve(__dirname, '../../..');
const WEB_DIR = resolve(ROOT_DIR, 'apps/web');
const DESKTOP_DIR = resolve(ROOT_DIR, 'apps/desktop');
const WEB_DIST = resolve(WEB_DIR, 'dist');
const RENDERER_DIR = resolve(DESKTOP_DIR, 'dist/renderer');

/**
 * Execute command and log output
 */
function run(command, cwd = ROOT_DIR) {
    console.log(`\n📦 Running: ${command}`);
    console.log(`   CWD: ${cwd}\n`);
    execSync(command, { stdio: 'inherit', cwd });
}

/**
 * Main build process
 */
async function main() {
    const startTime = Date.now();

    console.log('🚀 Starting Desktop Production Build\n');
    console.log('================================================');

    try {
        // Step 1: Clean previous builds
        console.log('\n📋 Step 1: Cleaning previous builds...');
        if (existsSync(RENDERER_DIR)) {
            rmSync(RENDERER_DIR, { recursive: true });
            console.log('   ✓ Cleaned dist/renderer');
        }

        // Step 2: Build web app
        console.log('\n📋 Step 2: Building @erp/web...');
        run('pnpm --filter @erp/web build');

        // Step 3: Verify web build output
        if (!existsSync(WEB_DIST)) {
            throw new Error(`Web build output not found at ${WEB_DIST}`);
        }
        console.log(`   ✓ Web build complete: ${WEB_DIST}`);

        // Step 4: Copy web build to desktop renderer directory
        console.log('\n📋 Step 3: Copying web build to desktop/dist/renderer...');
        mkdirSync(RENDERER_DIR, { recursive: true });
        cpSync(WEB_DIST, RENDERER_DIR, { recursive: true });
        console.log(`   ✓ Copied to: ${RENDERER_DIR}`);

        // Step 5: Build electron main/preload
        console.log('\n📋 Step 4: Building Electron main/preload...');
        run('pnpm --filter @erp/desktop build');
        console.log('   ✓ Electron build complete');

        // Step 6: Package with electron-builder (optional - can be run separately)
        const shouldPackage = process.argv.includes('--package');
        if (shouldPackage) {
            console.log('\n📋 Step 5: Packaging with electron-builder...');
            const platform = process.platform === 'darwin' ? 'mac' : process.platform === 'win32' ? 'win' : 'linux';
            run(`pnpm --filter @erp/desktop package:${platform}`);
            console.log('   ✓ Packaging complete');
        } else {
            console.log('\n📋 Step 5: Skipping packaging (run with --package to package)');
        }

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log('\n================================================');
        console.log(`✅ Desktop Production Build Complete! (${elapsed}s)`);
        console.log('\nOutput:');
        console.log(`  - Renderer: ${RENDERER_DIR}`);
        console.log(`  - Main:     ${join(DESKTOP_DIR, 'dist/main')}`);
        console.log(`  - Preload:  ${join(DESKTOP_DIR, 'dist/preload')}`);
        if (shouldPackage) {
            console.log(`  - Package:  ${join(DESKTOP_DIR, 'release')}`);
        }
        console.log('\nNext steps:');
        if (!shouldPackage) {
            console.log('  - Run "pnpm desktop:package" to create installer');
        }
        console.log('  - Test with "pnpm --filter @erp/desktop preview"');

    } catch (error) {
        console.error('\n❌ Build failed:', error);
        process.exit(1);
    }
}

main();
