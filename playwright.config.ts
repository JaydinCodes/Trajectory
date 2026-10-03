import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT ?? 3000);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({ testDir: "./e2e", use: { baseURL, ...devices["Desktop Chrome"] }, webServer: { command: `npm run dev -- -p ${port}`, url: baseURL, reuseExistingServer: true } });
