import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { apiPlugin } from "./server/api.mjs";
import { FLAVOURS } from "./src/data/flavours";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), apiPlugin(FLAVOURS)],
  server: {
    fs: {
      deny: [".env", ".env.*", "**/.data/**", "**/*.sqlite*", "**/.git/**"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
