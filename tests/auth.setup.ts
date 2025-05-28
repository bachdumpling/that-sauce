import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Navigate to sign-in page
  await page.goto("/sign-in");

  // Wait for the page to load
  await expect(page.locator("h1")).toContainText("Sign in");

  // Fill in login credentials using the correct data-testid selectors
  await page
    .locator('[data-testid="email-input"]')
    .fill("lehoangbach7802@gmail.com");
  await page.locator('[data-testid="password-input"]').fill("123456");

  // Click login button
  await page.locator('[data-testid="login-button"]').click();

  // Wait for successful login - check for user menu dropdown trigger
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
