import { test as setup, expect } from "@playwright/test";

const authFile = "playwright/.auth/user.json";

setup("authenticate", async ({ page }) => {
  // Navigate to login page
  await page.goto("/login");

  // Fill in login credentials
  // Note: You'll need to replace these with actual test credentials
  await page.locator('[data-testid="email-input"]').fill("test@example.com");
  await page.locator('[data-testid="password-input"]').fill("testpassword123");

  // Click login button
  await page.locator('[data-testid="login-button"]').click();

  // Wait for successful login (adjust selector based on your app)
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
