import { test, expect } from "@playwright/test";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";
test("register → upload → draft → publish → portfolio → share → analytics → unpublish", async ({
  page,
  browser,
}) => {
  const stamp = Date.now(),
    email = `smoke-${stamp}@example.com`,
    slug = `smoke-${stamp}`;
  await page.goto("/register");
  await page.getByLabel("Full name").fill("Morgan Smoke");
  await page.getByLabel("Email address").fill(email);
  await page
    .getByLabel("Password", { exact: true })
    .fill("SmokeTestPassword123!");
  await page.getByRole("button", { name: "Create your free account" }).click();
  await expect(page).toHaveURL(/dashboard/);
  let token;
  for (let tries = 0; tries < 10 && !token; tries++) {
    for (const file of await readdir(resolve("work/mail"))) {
      const mail = JSON.parse(
        await readFile(resolve("work/mail", file), "utf8"),
      );
      if (mail.to === email) token = mail.text.match(/token=([a-f0-9]{64})/)[1];
    }
    if (!token) await new Promise((r) => setTimeout(r, 200));
  }
  expect(token).toBeTruthy();
  await page.goto(`/verify-email#token=${token}`);
  await page.getByRole("button", { name: "Verify email" }).click();
  await expect(page.getByText("Your email is verified.")).toBeVisible();
  await page.goto("/dashboard/cards/new");
  await page.getByLabel("Full name", { exact: true }).fill("Morgan Smoke");
  await page.getByLabel("Professional title").fill("Independent Designer");
  await page
    .getByLabel("A little about you")
    .fill("Meaningful work, thoughtful connections.");
  await page.getByLabel("Profile address").fill(slug);
  const png = await sharp({
    create: { width: 100, height: 100, channels: 3, background: "#635bff" },
  })
    .png()
    .toBuffer();
  await page
    .getByLabel("Upload profile photo")
    .setInputFiles({
      name: "portrait.png",
      mimeType: "image/png",
      buffer: png,
    });
  await expect(page.getByText("Image uploaded")).toBeVisible();
  await page.getByRole("button", { name: "Links", exact: true }).click();
  await page.getByLabel("Email", { exact: true }).fill("hello@example.com");
  await page.getByRole("button", { name: "Add social link" }).click();
  await page.getByLabel("Social URL 1").fill("https://example.com");
  await page.getByRole("button", { name: "Design", exact: true }).click();
  await page.getByRole("button", { name: "minimal", exact: true }).click();
  await expect(page.locator(".profile-card")).toHaveClass(/template-minimal/);
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/dashboard\/cards\/[a-f0-9]+/);
  await expect(page.getByText("Draft saved")).toBeVisible();
  const visitor = await browser.newContext();
  const publicPage = await visitor.newPage();
  await publicPage.goto(
    `${process.env.TEST_BASE_URL || "http://localhost:4380"}/${slug}`,
  );
  await expect(publicPage.getByRole("alert")).toContainText("not available");
  await page.getByRole("button", { name: "Publish card" }).click();
  await expect(page.getByText("Your card is live")).toBeVisible();
  await publicPage.reload();
  await expect(
    publicPage.getByRole("heading", { name: "Morgan Smoke" }),
  ).toBeVisible();
  await expect(
    publicPage.getByRole("link", { name: "Email me" }),
  ).toHaveAttribute("href", "mailto:hello@example.com");
  await page.getByRole("button", { name: "Details", exact: true }).click();
  await page.getByLabel("Full name", { exact: true }).fill("Morgan Updated");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page.getByText("Draft saved")).toBeVisible();
  await publicPage.reload();
  await expect(
    publicPage.getByRole("heading", { name: "Morgan Smoke" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Republish changes" }).click();
  await expect(page.getByText("Your card is live")).toBeVisible();
  await publicPage.reload();
  await expect(
    publicPage.getByRole("heading", { name: "Morgan Updated" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Share & QR" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "PNG", exact: true }).click();
  expect((await download).suggestedFilename()).toBe(`${slug}-qr.png`);
  await page.goto("/dashboard/portfolio");
  await page.getByRole("button", { name: "Add project" }).click();
  await page.getByLabel("Project title").fill("Studio identity");
  await page.getByLabel("Description").fill("A thoughtful visual identity.");
  await page.getByLabel("Show on published profile").check();
  await page.getByRole("button", { name: "Save project" }).click();
  await expect(
    page.getByRole("heading", { name: "Studio identity" }),
  ).toBeVisible();
  await publicPage.reload();
  await expect(
    publicPage.getByRole("heading", { name: "Studio identity" }),
  ).toBeVisible();
  await page.goto("/dashboard/analytics");
  await expect(
    page
      .locator(".metric")
      .filter({ hasText: "Profile views" })
      .locator("strong"),
  ).toHaveText("1");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "work/qa-dashboard-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "work/qa-dashboard-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/dashboard/cards");
  await page.getByRole("link", { name: "Edit card" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Unpublish", exact: true }).click();
  await expect(page.getByText("Card unpublished")).toBeVisible();
  await publicPage.reload();
  await expect(publicPage.getByRole("alert")).toContainText("not available");
  await visitor.close();
  await page.goto("/dashboard/cards");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete card" }).click();
  await expect(
    page.getByText("Your first impression starts here"),
  ).toBeVisible();
});
test("marketing is responsive and direct routes refresh", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Your identity. One link./i }),
  ).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({
    path: "work/qa-home-desktop.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "work/qa-home-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/examples?template=editorial");
  await page.reload();
  await expect(page.locator(".profile-card")).toHaveClass(/template-editorial/);
});
