import { expect, test } from "@playwright/test";
import { ensureOnboarded } from "./onboarding-helper";
const shiftDate = (date: string, days: number) => { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + days); return value.toISOString().slice(0, 10); };

test("a fresh installation starts a real first season without demo records", async ({ page }) => {
  const status = await page.request.get("/api/onboarding");
  expect(status.ok()).toBe(true);
  expect(await status.json()).toEqual({ completed: false });
  await page.goto("/");
  await expect(page).toHaveURL(/\/onboarding/);
  await expect(page.getByRole("heading", { name: /A record of where/i })).toBeVisible();
  await page.getByRole("button", { name: "Begin" }).click();
  await page.getByLabel("Coding").check();
  await page.getByLabel("Career").check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByLabel("Season name").fill("My first season");
  await page.getByLabel("Theme").fill("Build steadily");
  const today = await page.evaluate(() => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()));
  await page.getByLabel("Start date").fill(shiftDate(today, -14));
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("textbox", { name: "Coding" }).fill("Build a steady coding practice.");
  await page.getByRole("textbox", { name: "Career" }).fill("Ship useful work.");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: /Add a goal/i }).click();
  const goal = page.locator(".onboarding-goals article");
  await goal.getByRole("textbox", { name: "Goal" }).fill("Solve DSA problems");
  await goal.getByLabel("Target").fill("20");
  await goal.getByLabel("Tracking").selectOption("derived");
  await goal.getByLabel("Metric").selectOption("dsa_problems");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("Solve DSA problems")).toBeVisible();
  await page.getByRole("button", { name: "Start my season" }).click();
  await expect(page).toHaveURL(/\/?started=1/);
  await expect(page.getByText(/Nothing recorded today yet/i)).toBeVisible();
  await page.getByRole("button", { name: /Quick log/i }).click();
  const dialog = page.getByRole("dialog", { name: "What moved today?" });
  await dialog.getByRole("button", { name: "DSA" }).click();
  await dialog.getByRole("textbox", { name: /topic or category/i }).fill("Arrays");
  await dialog.getByLabel("Problems").fill("2");
  await dialog.getByRole("button", { name: "Log evidence" }).click();
  await expect(page.getByText(/DSA/i).first()).toBeVisible();
});

test("an existing onboarded user opens Today instead of onboarding", async ({ page }) => {
  await ensureOnboarded(page);
  await page.goto("/");
  await expect(page).not.toHaveURL(/\/onboarding/);
  await expect(page.getByRole("heading", { name: "Today." })).toBeVisible();
});
