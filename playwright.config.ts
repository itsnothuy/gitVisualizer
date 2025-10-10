import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  webServer: { command: "pnpm dev", port: 3000 },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
