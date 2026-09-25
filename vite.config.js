import { randomUUID } from "node:crypto";
import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

const SERVER_BOOT_ID = "virtual:server-boot";
const RESOLVED_SERVER_BOOT_ID = `\0${SERVER_BOOT_ID}`;

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
  plugins: [serverBootPlugin(), vue(), vueDevTools()],
  base: "/movie-map-test/",
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
