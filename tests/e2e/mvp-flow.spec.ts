import { expect, test } from "@playwright/test";

test("homepage shows three Chinese entry cards", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("图片生成模板")).toBeVisible();
  await expect(page.getByText("描述词生成模板")).toBeVisible();
  await expect(page.getByText("模板生成图片")).toBeVisible();
});

test("generate workspace shows slot form and progress section", async ({ page }) => {
  await page.goto("/generate");

  await expect(page.getByText("模板生成图片")).toBeVisible();
  await expect(page.getByText("最终提示词预览")).toBeVisible();
  await expect(page.getByText("生成进度")).toBeVisible();
});
