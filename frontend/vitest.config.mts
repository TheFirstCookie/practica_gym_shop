import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Same "@/…" imports as tsconfig.json.
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) }
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    env: { NEXT_PUBLIC_API_URL: "https://api.test" },
    restoreMocks: true
  }
});
