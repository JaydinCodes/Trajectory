import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;
const testDatabase = process.env.TRAJECTORY_DB_PATH ?? path.join(process.cwd(), ".tmp", "playwright", `trajectory-${process.pid}.db`);

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile-critical-flow\.spec\.ts/ },
    { name: "mobile", use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 }, testMatch: /mobile-critical-flow\.spec\.ts/ },
  ],
  webServer: { command: `npm run dev -- -p ${port}`, url: baseURL, reuseExistingServer: false, env: { ...process.env, TRAJECTORY_DB_PATH: testDatabase, TRAJECTORY_SEED_DEMO: "true" } },
});
