import { randomUUID } from "node:crypto";
import { copyFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

const SERVER_BOOT_ID = "virtual:server-boot";
const RESOLVED_SERVER_BOOT_ID = `\0${SERVER_BOOT_ID}`;

function githubPagesSpaFallback() {
  let outDir = "";
  return {
    name: "github-pages-spa-fallback",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      copyFileSync(join(outDir, "index.html"), join(outDir, "404.html"));
    },
  };
}

function serverBootPlugin() {
  const bootId = randomUUID();
  return {
    name: "server-boot",
    resolveId(id) {
      if (id === SERVER_BOOT_ID) return RESOLVED_SERVER_BOOT_ID;
    },
    load(id) {
      if (id === RESOLVED_SERVER_BOOT_ID) {
        return `export const serverBootId = ${JSON.stringify(bootId)}\n`;
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [serverBootPlugin(), githubPagesSpaFallback(), vue(), vueDevTools()],
  base: "/movie-map-test/",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    watch: {
      ignored: ["**/tmp-chrome-profile/**"],
    },
  },
});
