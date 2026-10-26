/// <reference types="vitest" />

import path from "path"
import legacy from "@vitejs/plugin-legacy"
import vue from "@vitejs/plugin-vue"
import { defineConfig, loadEnv } from "vite"
import { commonEnvPlugin } from "../../common/vite/commonEnvPlugin"
import { localApiServerDiscoveryPlugin } from "../../common/vite/localApiServerDiscoveryPlugin"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  // "" = the root bootstrap build; "vX.Y.Z" = a build served under /vX.Y.Z/ (multi-version hosting).
  // `|| "{}"`: vitest loads this config too, and a fresh clone has no .env.
  const appBuild = JSON.parse(env.VITE_APP_VERSION_CONFIG || "{}").buildVersion

  return {
    base: appBuild ? `/${appBuild}/` : "/",
    build: {
      outDir: appBuild ? `dist/${appBuild}` : "dist"
    },
    server: {
      proxy: {
        "/api": { // Only relative paths are allowed
          target: "https://localhost:8443/", // Your external server URL
          changeOrigin: true, // Changes the "Origin" header to match the target
          secure: false, // Set to false if you have SSL issues locally
        }
      }
    },
    plugins: [
      commonEnvPlugin(),
      vue(),
      legacy(),
      localApiServerDiscoveryPlugin()
    ],
    resolve: {
      dedupe: ["vue", "vue-router", "@ionic/vue", "@ionic/vue-router", "pinia", "vue-i18n"],
      extensions: [".ts", ".tsx", ".mjs", ".js", ".mts", ".jsx", ".json"],
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@common": path.resolve(__dirname, "../../common")
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      include: ["tests/**/*.spec.ts"],
      exclude: ["node_modules", "dist"]
    }
  }
})
