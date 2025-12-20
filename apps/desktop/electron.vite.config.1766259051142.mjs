// electron.vite.config.ts
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";
var __electron_vite_injected_dirname = "C:\\Users\\Chong\\Documents\\VibeCoding\\ERP-System\\apps\\desktop";
var esmPackages = [
  "electron-store",
  "conf",
  "env-paths",
  "atomically",
  "type-fest",
  "dot-prop",
  "debounce-fn",
  "pkg-up",
  "uint8array-extras",
  "mimic-function",
  "find-up-simple",
  "stubborn-fs",
  "when-exit",
  // ajv and dependencies
  "ajv",
  "ajv-formats",
  "fast-deep-equal",
  "json-schema-traverse",
  "uri-js",
  "require-from-string"
];
var electron_vite_config_default = defineConfig({
  main: {
    plugins: [
      externalizeDepsPlugin({
        // Bundle ESM packages, externalize the rest
        exclude: esmPackages
      })
    ],
    build: {
      outDir: "dist/main",
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "src/main/index.ts")
        },
        output: {
          // Output as CommonJS for better electron compatibility
          format: "cjs",
          entryFileNames: "[name].js"
        }
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist/preload",
      rollupOptions: {
        input: {
          index: resolve(__electron_vite_injected_dirname, "src/preload/index.ts")
        },
        output: {
          format: "cjs",
          entryFileNames: "[name].js"
        }
      }
    }
  }
  // NOTE: No renderer config here!
  // In development, we load the @erp/web dev server at http://localhost:5173
  // In production, we copy the web app's built files to dist/renderer
});
export {
  electron_vite_config_default as default
};
