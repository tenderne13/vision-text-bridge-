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

test("user can create a prompt template and generate an image", async ({ page }) => {
  await page.goto("/prompt-template");
  await page
    .getByPlaceholder("请输入原始描述词")
    .fill("一张咖啡杯商业海报，北欧极简风格，米色背景，柔和棚拍光线");
  await page.getByRole("button", { name: "抽取模板" }).click();
  await expect(page.getByRole("button", { name: "保存并去生成" })).toBeVisible({
    timeout: 10000
  });
  await page.getByRole("button", { name: "保存并去生成" }).click();
  await expect(page).toHaveURL(/\/generate/);
  await page.getByLabel("主体").fill("玻璃冷萃咖啡");
  await page.getByRole("button", { name: "开始生成" }).click();
  await expect(page.getByText("正在请求生成")).toBeVisible();
  await expect(page.getByAltText("生成结果")).toBeVisible();
});
