import { test, expect, Page } from "@playwright/test";
import path from "path";

// Use authenticated state
test.use({ storageState: "playwright/.auth/user.json" });

// Test data
const testProject = {
  title: "Test Creative Project",
  shortDescription: "A test project for automated testing",
  description:
    "This is a longer description of the test project that includes more details about the creative work.",
  roles: ["UI/UX Designer", "Frontend Developer"],
  year: 2024,
};

// Helper function to create test files
async function createTestFile(
  filename: string,
  content: string,
  mimeType: string
): Promise<string> {
  const testFilesDir = path.join(__dirname, "fixtures");
  const filePath = path.join(testFilesDir, filename);

  // Create directory if it doesn't exist
  const fs = require("fs");
  if (!fs.existsSync(testFilesDir)) {
    fs.mkdirSync(testFilesDir, { recursive: true });
  }

  // Create a simple test file
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Helper function to wait for file input and upload
async function uploadFile(page: Page, selector: string, filePath: string) {
  const fileInput = page.locator(selector);
  await fileInput.setInputFiles(filePath);
}

test.describe("New Project Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the new project page
    await page.goto("/project/new");

    // Wait for the page to load
    await expect(page.locator("h1")).toContainText("Create New Project");
  });

  test("should display the new project form with correct initial state", async ({
    page,
  }) => {
    // Check that the main heading is present
    await expect(page.locator("h1")).toContainText("Create New Project");

    // Check that the form is in the media upload step initially
    await expect(
      page.locator('[data-testid="media-upload-step"]')
    ).toBeVisible();

    // Check that the project details step is not visible initially
    await expect(
      page.locator('[data-testid="project-details-step"]')
    ).not.toBeVisible();
  });

  test("should redirect unauthenticated users to sign-in", async ({
    browser,
  }) => {
    // Create a new context without authentication
    const context = await browser.newContext();
    const page = await context.newPage();

    // Try to access the new project page without authentication
    await page.goto("/project/new");

    // Should be redirected to sign-in page
    await expect(page).toHaveURL(/.*\/sign-in/);

    await context.close();
  });

  test("should handle file upload via drag and drop", async ({ page }) => {
    // Create a test image file
    const testImagePath = await createTestFile(
      "test-image.jpg",
      "fake-image-content",
      "image/jpeg"
    );

    // Find the drop zone
    const dropZone = page.locator('[data-testid="file-drop-zone"]');
    await expect(dropZone).toBeVisible();

    // Upload file via file input (simulating drag and drop)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);

    // Check that the file appears in the media list
    await expect(page.locator('[data-testid="media-item"]')).toHaveCount(1);

    // Check that the proceed button becomes enabled
    await expect(
      page.locator('[data-testid="proceed-to-details"]')
    ).toBeEnabled();
  });

  test("should handle video link upload (YouTube)", async ({ page }) => {
    // Click on the video link tab
    await page.locator('[data-value="link"]').click();

    // Enter a YouTube URL
    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    await page.locator('[data-testid="media-link-input"]').fill(youtubeUrl);

    // Click add link button
    await page.locator('[data-testid="add-media-link"]').click();

    // Check that the video appears in the media list
    await expect(page.locator('[data-testid="media-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="media-item"]')).toContainText(
      "youtube"
    );
  });

  test("should handle video link upload (Vimeo)", async ({ page }) => {
    // Click on the video link tab
    await page.locator('[data-value="link"]').click();

    // Enter a Vimeo URL
    const vimeoUrl = "https://vimeo.com/1072008273/ecb6710763";
    await page.locator('[data-testid="media-link-input"]').fill(vimeoUrl);

    // Click add link button
    await page.locator('[data-testid="add-media-link"]').click();

    // Check that the video appears in the media list
    await expect(page.locator('[data-testid="media-item"]')).toHaveCount(1);
    await expect(page.locator('[data-testid="media-item"]')).toContainText(
      "vimeo"
    );
  });

  test("should validate file types and show error for unsupported files", async ({
    page,
  }) => {
    // Create an unsupported file type
    const testFilePath = await createTestFile(
      "test-file.txt",
      "text content",
      "text/plain"
    );

    // Try to upload the unsupported file
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testFilePath);

    // Check for error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "Unsupported file type"
    );
  });

  test("should allow removing uploaded media", async ({ page }) => {
    // Upload a test file first
    const testImagePath = await createTestFile(
      "test-image.jpg",
      "fake-image-content",
      "image/jpeg"
    );
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);

    // Verify file is uploaded
    await expect(page.locator('[data-testid="media-item"]')).toHaveCount(1);

    // Click remove button
    await page.locator('[data-testid="remove-media"]').first().click();

    // Verify file is removed
    await expect(page.locator('[data-testid="media-item"]')).toHaveCount(0);

    // Check that proceed button is disabled
    await expect(
      page.locator('[data-testid="proceed-to-details"]')
    ).toBeDisabled();
  });

  test("should allow selecting thumbnail from uploaded media", async ({
    page,
  }) => {
    // Upload multiple test files
    const testImage1Path = await createTestFile(
      "test-image1.jpg",
      "fake-image-content-1",
      "image/jpeg"
    );
    const testImage2Path = await createTestFile(
      "test-image2.jpg",
      "fake-image-content-2",
      "image/jpeg"
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([testImage1Path, testImage2Path]);

    // Verify files are uploaded
    await expect(page.locator('[data-testid="media-item"]')).toHaveCount(2);

    // Select the second image as thumbnail
    await page.locator('[data-testid="select-thumbnail"]').nth(1).click();

    // Verify thumbnail is selected
    await expect(
      page.locator('[data-testid="selected-thumbnail"]')
    ).toHaveCount(1);
  });

  test("should proceed to project details step", async ({ page }) => {
    // Upload a test file first
    const testImagePath = await createTestFile(
      "test-image.jpg",
      "fake-image-content",
      "image/jpeg"
    );
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);

    // Click proceed to details
    await page.locator('[data-testid="proceed-to-details"]').click();

    // Check that we're now on the project details step
    await expect(
      page.locator('[data-testid="project-details-step"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="media-upload-step"]')
    ).not.toBeVisible();
  });

  test("should fill out project details form", async ({ page }) => {
    // First, upload media and proceed to details
    const testImagePath = await createTestFile(
      "test-image.jpg",
      "fake-image-content",
      "image/jpeg"
    );
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);
    await page.locator('[data-testid="proceed-to-details"]').click();

    // Fill out the project details form
    await page.locator('[data-testid="project-title"]').fill(testProject.title);
    await page
      .locator('[data-testid="project-short-description"]')
      .fill(testProject.shortDescription);
    await page
      .locator('[data-testid="project-description"]')
      .fill(testProject.description);

    // Select roles (assuming multi-select component)
    for (const role of testProject.roles) {
      await page.locator('[data-testid="roles-select"]').click();
      await page.locator(`[data-value="${role}"]`).click();
    }

    // Set year
    await page
      .locator('[data-testid="project-year"]')
      .fill(testProject.year.toString());

    // Verify form is filled
    await expect(page.locator('[data-testid="project-title"]')).toHaveValue(
      testProject.title
    );
    await expect(
      page.locator('[data-testid="project-short-description"]')
    ).toHaveValue(testProject.shortDescription);
  });

  test("should validate required fields in project details", async ({
    page,
  }) => {
    // First, upload media and proceed to details
    const testImagePath = await createTestFile(
      "test-image.jpg",
      "fake-image-content",
      "image/jpeg"
    );
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);
    await page.locator('[data-testid="proceed-to-details"]').click();

    // Try to submit without filling required fields
    await page.locator('[data-testid="create-project"]').click();

    // Check for validation errors
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "title is required"
    );
  });

  test("should go back to media upload step", async ({ page }) => {
    // First, upload media and proceed to details
    const testImagePath = await createTestFile(
      "test-image.jpg",
      "fake-image-content",
      "image/jpeg"
    );
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);
    await page.locator('[data-testid="proceed-to-details"]').click();

    // Click back button
    await page.locator('[data-testid="back-to-media"]').click();

    // Check that we're back on the media upload step
    await expect(
      page.locator('[data-testid="media-upload-step"]')
    ).toBeVisible();
    await expect(
      page.locator('[data-testid="project-details-step"]')
    ).not.toBeVisible();

    // Verify uploaded media is still there
    await expect(page.locator('[data-testid="media-item"]')).toHaveCount(1);
  });

  test("should complete full project creation flow", async ({ page }) => {
    // Step 1: Upload media
    const testImagePath = await createTestFile(
      "test-image.jpg",
      "fake-image-content",
      "image/jpeg"
    );
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);

    // Select thumbnail
    await page.locator('[data-testid="select-thumbnail"]').first().click();

    // Proceed to details
    await page.locator('[data-testid="proceed-to-details"]').click();

    // Step 2: Fill project details
    await page.locator('[data-testid="project-title"]').fill(testProject.title);
    await page
      .locator('[data-testid="project-short-description"]')
      .fill(testProject.shortDescription);
    await page
      .locator('[data-testid="project-description"]')
      .fill(testProject.description);

    // Select roles
    for (const role of testProject.roles) {
      await page.locator('[data-testid="roles-select"]').click();
      await page.locator(`[data-value="${role}"]`).click();
      // Close dropdown
      await page.keyboard.press("Escape");
    }

    // Set year
    await page
      .locator('[data-testid="project-year"]')
      .fill(testProject.year.toString());

    // Step 3: Create project
    await page.locator('[data-testid="create-project"]').click();

    // Wait for success message or redirect
    await expect(page.locator('[data-testid="success-message"]')).toContainText(
      "Project created successfully"
    );

    // Or check for redirect to project page
    await page.waitForURL(/\/.*\/work\/.*/, { timeout: 10000 });
  });

  test("should handle project creation errors gracefully", async ({ page }) => {
    // Mock a server error by intercepting the API call
    await page.route("**/api/projects", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Server error" }),
      });
    });

    // Complete the form
    const testImagePath = await createTestFile(
      "test-image.jpg",
      "fake-image-content",
      "image/jpeg"
    );
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);
    await page.locator('[data-testid="proceed-to-details"]').click();

    await page.locator('[data-testid="project-title"]').fill(testProject.title);
    await page
      .locator('[data-testid="project-short-description"]')
      .fill(testProject.shortDescription);
    await page
      .locator('[data-testid="project-year"]')
      .fill(testProject.year.toString());

    // Try to create project
    await page.locator('[data-testid="create-project"]').click();

    // Check for error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText(
      "Server error"
    );
  });

  test("should handle large file uploads", async ({ page }) => {
    // Create a large test file (simulate > 5MB)
    const largeContent = "x".repeat(6 * 1024 * 1024); // 6MB of content
    const largeFilePath = await createTestFile(
      "large-image.jpg",
      largeContent,
      "image/jpeg"
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(largeFilePath);

    // Check for large file warning
    await expect(
      page.locator('[data-testid="large-file-warning"]')
    ).toBeVisible();
  });

  test("should support mobile responsive design", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Check that the form is still usable on mobile
    await expect(page.locator("h1")).toContainText("Create New Project");
    await expect(
      page.locator('[data-testid="media-upload-step"]')
    ).toBeVisible();

    // Upload a file on mobile
    const testImagePath = await createTestFile(
      "test-image-mobile.jpg",
      "fake-image-content",
      "image/jpeg"
    );
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(testImagePath);

    // Verify file upload works on mobile
    await expect(page.locator('[data-testid="media-item"]')).toHaveCount(1);
  });

  test("should handle import from external URLs", async ({ page }) => {
    // Click on import tab
    await page.locator('[data-value="import"]').click();

    // Enter a project URL to import from
    const projectUrl = "https://example.com/portfolio";
    await page.locator('[data-testid="project-url-input"]').fill(projectUrl);

    // Click import button
    await page.locator('[data-testid="import-media"]').click();

    // Check for import progress or results
    await expect(page.locator('[data-testid="import-progress"]')).toBeVisible();
  });
});
