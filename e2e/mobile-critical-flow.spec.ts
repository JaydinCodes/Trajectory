import { expect, test } from "@playwright/test";

test("mobile navigation keeps the core journey reachable", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Today." })).toBeVisible();
  await page.getByRole("button", { name: /quick log/i }).click();
  const dialog = page.getByRole("dialog", { name: "What moved today?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "DSA" }).click();
  await dialog.getByRole("textbox", { name: /topic or category/i }).fill("Mobile flow");
  await dialog.getByLabel(/problems/i).fill("2");
  await dialog.getByRole("button", { name: "Log evidence" }).click();
  await expect(page.getByRole("status")).toContainText("DSA logged");

  await page.getByRole("link", { name: "Review", exact: true }).click();
  await expect(page.getByRole("heading", { name: /A week in/i })).toBeVisible();
  await page.getByRole("link", { name: "History" }).click();
  await expect(page.getByRole("heading", { name: /Where you/i })).toBeVisible();
  await page.getByRole("link", { name: "Patterns" }).click();
  await expect(page.getByRole("heading", { name: /What your record/i })).toBeVisible();
});
