import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: process.env.TEST_BASE_URL || "http://localhost:4380",
    channel: "chrome",
    headless: true,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  reporter: "list",
});
