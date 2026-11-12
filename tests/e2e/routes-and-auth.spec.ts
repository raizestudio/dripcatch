import { expect, test } from "@playwright/test";

test.describe("Auth guard & localized routing", () => {
  test("redirects unauthenticated users from /en/ledger to /en/login with ?next=", async ({
    page,
  }) => {
    await page.goto("/en/ledger");
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fen%2Fledger/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("redirects unauthenticated users from /fr/ledger to /fr/login with ?next=", async ({
    page,
  }) => {
    await page.goto("/fr/ledger");
    await expect(page).toHaveURL(/\/fr\/login\?next=%2Ffr%2Fledger/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("toggles between Sign In and Sign Up modes on /en/login", async ({
    page,
  }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await page.goto("/en/login", { waitUntil: "networkidle" });
    expect(pageErrors).toEqual([]);

    const inputs = page.locator("form input");
    await expect(inputs).toHaveCount(2);

    await page.getByRole("button", { name: /create one/i }).click();
    await expect(inputs).toHaveCount(3);
  });

  for (const path of [
    "/en",
    "/fr",
    "/en/privacy",
    "/fr/privacy",
    "/en/terms",
    "/en/security",
    "/en/contact",
  ]) {
    test(`renders ${path} without server errors`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
    });
  }
});
