import type { Page } from "@playwright/test";

export async function ensureOnboarded(page: Page) {
  const status = await page.request.get("/api/onboarding");
  if ((await status.json() as { completed: boolean }).completed) return;
  const today = await page.evaluate(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
  const start = new Date(`${today}T00:00:00Z`); start.setUTCDate(start.getUTCDate() - 14); const startDate = start.toISOString().slice(0, 10);
  const end = `${today.slice(0, 8)}${String(new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0)).getUTCDate()).padStart(2, "0")}`;
  const response = await page.request.post("/api/onboarding", { data: { name: "First season", theme: "Begin", intention: "", startDate, endDate: end, areaPlans: [{ area: "Career", outcome: "Build a steady record." }], goals: [{ title: "First focus", area: "Career", target: 1, goalType: "count", trackingMode: "manual", metricKey: null, importance: "normal", deadline: end }], lessons: [] } });
  if (!response.ok()) throw new Error(`Could not create test season: ${await response.text()}`);
}
