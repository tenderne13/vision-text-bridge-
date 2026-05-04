import { expect, test } from "@playwright/test";

test("homepage shows the app title", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Vision Text Bridge")).toBeVisible();
});
