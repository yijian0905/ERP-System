import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import { resolve } from 'path';

// ESM packages and dependencies that need to be bundled (not externalized)
const esmPackages = [
    'electron-store',
    'conf',
    'env-paths',
    'atomically',
    'type-fest',
    'dot-prop',
    'debounce-fn',
    'pkg-up',
    'uint8array-extras',
    'mimic-function',
    'find-up-simple',
    'stubborn-fs',
    'when-exit',
    // ajv and dependencies
    'ajv',
    'ajv-formats',
    'fast-deep-equal',
    'json-schema-traverse',
    'uri-js',
    'require-from-string',
];

export default defineConfig({
    main: {
        plugins: [
            externalizeDepsPlugin({
                // Bundle ESM packages, externalize the rest
                exclude: esmPackages,
            }),
        ],
        build: {
            outDir: 'dist/main',
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/main/index.ts'),
                },
                output: {
                    // Output as CommonJS for better electron compatibility
                    format: 'cjs',
                    entryFileNames: '[name].js',
                },
            },
        },
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'dist/preload',
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/preload/index.ts'),
                },
                output: {
                    format: 'cjs',
                    entryFileNames: '[name].js',
                },
            },
        },
    },
    // NOTE: No renderer config here!
    // In development, we load the @erp/web dev server at http://localhost:5173
    // In production, we copy the web app's built files to dist/renderer
});
