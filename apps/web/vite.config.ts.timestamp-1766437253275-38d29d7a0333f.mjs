// vite.config.ts
import { TanStackRouterVite } from "file:///C:/Users/Chong/Documents/VibeCoding/ERP-System/node_modules/.pnpm/@tanstack+router-vite-plugin@1.139.14_@tanstack+react-router@1.139.14_react-dom@18.3.1_react@_uyysdgrepsys3aal3k6drlvrpe/node_modules/@tanstack/router-vite-plugin/dist/esm/index.js";
import react from "file:///C:/Users/Chong/Documents/VibeCoding/ERP-System/node_modules/.pnpm/@vitejs+plugin-react-swc@3.11.0_@swc+helpers@0.5.17_vite@5.4.21_@types+node@20.19.25_/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { defineConfig } from "file:///C:/Users/Chong/Documents/VibeCoding/ERP-System/node_modules/.pnpm/vite@5.4.21_@types+node@20.19.25/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "C:\\Users\\Chong\\Documents\\VibeCoding\\ERP-System\\apps\\web";
var vite_config_default = defineConfig(() => {
  const apiUrl = process.env.VITE_API_URL || "http://localhost:3000";
  return {
    plugins: [react(), TanStackRouterVite()],
    // Use relative paths for Electron file:// protocol compatibility
    base: "./",
    resolve: {
      alias: {
        "@": path.resolve(__vite_injected_original_dirname, "./src")
      }
    },
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: apiUrl,
          changeOrigin: true
        },
        "/auth": {
          target: apiUrl,
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: "dist",
      sourcemap: true,
      // Allow larger chunks - Vite will handle splitting automatically
      chunkSizeWarningLimit: 1e3
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxDaG9uZ1xcXFxEb2N1bWVudHNcXFxcVmliZUNvZGluZ1xcXFxFUlAtU3lzdGVtXFxcXGFwcHNcXFxcd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxDaG9uZ1xcXFxEb2N1bWVudHNcXFxcVmliZUNvZGluZ1xcXFxFUlAtU3lzdGVtXFxcXGFwcHNcXFxcd2ViXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9DaG9uZy9Eb2N1bWVudHMvVmliZUNvZGluZy9FUlAtU3lzdGVtL2FwcHMvd2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgVGFuU3RhY2tSb3V0ZXJWaXRlIH0gZnJvbSAnQHRhbnN0YWNrL3JvdXRlci12aXRlLXBsdWdpbic7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xyXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJztcclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKCkgPT4ge1xyXG4gIC8vIEdldCBBUEkgVVJMIGZyb20gZW52aXJvbm1lbnQgdmFyaWFibGUsIGZhbGxiYWNrIHRvIGxvY2FsaG9zdCBmb3IgZGV2ZWxvcG1lbnRcclxuICBjb25zdCBhcGlVcmwgPSBwcm9jZXNzLmVudi5WSVRFX0FQSV9VUkwgfHwgJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMCc7XHJcblxyXG4gIHJldHVybiB7XHJcbiAgICBwbHVnaW5zOiBbcmVhY3QoKSwgVGFuU3RhY2tSb3V0ZXJWaXRlKCldLFxyXG4gICAgLy8gVXNlIHJlbGF0aXZlIHBhdGhzIGZvciBFbGVjdHJvbiBmaWxlOi8vIHByb3RvY29sIGNvbXBhdGliaWxpdHlcclxuICAgIGJhc2U6ICcuLycsXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgJ0AnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnLi9zcmMnKSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgcG9ydDogNTE3MyxcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICAnL2FwaSc6IHtcclxuICAgICAgICAgIHRhcmdldDogYXBpVXJsLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgJy9hdXRoJzoge1xyXG4gICAgICAgICAgdGFyZ2V0OiBhcGlVcmwsXHJcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICBvdXREaXI6ICdkaXN0JyxcclxuICAgICAgc291cmNlbWFwOiB0cnVlLFxyXG4gICAgICAvLyBBbGxvdyBsYXJnZXIgY2h1bmtzIC0gVml0ZSB3aWxsIGhhbmRsZSBzcGxpdHRpbmcgYXV0b21hdGljYWxseVxyXG4gICAgICBjaHVua1NpemVXYXJuaW5nTGltaXQ6IDEwMDAsXHJcbiAgICB9LFxyXG4gIH07XHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVXLFNBQVMsMEJBQTBCO0FBQzFZLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyxvQkFBb0I7QUFIN0IsSUFBTSxtQ0FBbUM7QUFLekMsSUFBTyxzQkFBUSxhQUFhLE1BQU07QUFFaEMsUUFBTSxTQUFTLFFBQVEsSUFBSSxnQkFBZ0I7QUFFM0MsU0FBTztBQUFBLElBQ0wsU0FBUyxDQUFDLE1BQU0sR0FBRyxtQkFBbUIsQ0FBQztBQUFBO0FBQUEsSUFFdkMsTUFBTTtBQUFBLElBQ04sU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBLFFBQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLE1BQ3RDO0FBQUEsSUFDRjtBQUFBLElBQ0EsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFFBQ2hCO0FBQUEsUUFDQSxTQUFTO0FBQUEsVUFDUCxRQUFRO0FBQUEsVUFDUixjQUFjO0FBQUEsUUFDaEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLE1BQ1IsV0FBVztBQUFBO0FBQUEsTUFFWCx1QkFBdUI7QUFBQSxJQUN6QjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
