import { test, expect } from "@playwright/test";
import { NewProjectPage } from "./page-objects/new-project-page";
import path from "path";

// Test data
const testProject = {
  title: "Test Creative Project POM",
  shortDescription: "A test project using Page Object Model",
  description:
    "This is a longer description of the test project that includes more details about the creative work.",
  roles: ["UI/UX Designer", "Frontend Developer"],
  year: 2024,
};

test.describe("New Project Flow - Page Object Model", () => {
  let newProjectPage: NewProjectPage;

  test.beforeEach(async ({ page }) => {
    newProjectPage = new NewProjectPage(page);
    await newProjectPage.goto();
  });

  test("should display initial state correctly", async ({ page }) => {
    await expect(newProjectPage.heading).toContainText("Create New Project");
    expect(await newProjectPage.isInMediaUploadStep()).toBe(true);
    expect(await newProjectPage.isInProjectDetailsStep()).toBe(false);
  });

  test("should handle file upload workflow", async ({ page }) => {
    const testImagePath = path.join(__dirname, "fixtures", "test-image.jpg");

    // Upload file
    await newProjectPage.uploadFile(testImagePath);

    // Verify file is uploaded
    expect(await newProjectPage.getMediaCount()).toBe(1);
    expect(await newProjectPage.isProceedButtonEnabled()).toBe(true);

    // Select thumbnail
    await newProjectPage.selectThumbnail(0);

    // Proceed to details
    await newProjectPage.proceedToDetails();

    // Fill project details
    await newProjectPage.fillProjectDetails(testProject);

    // Create project
    await newProjectPage.createProject();

    // Wait for success or redirect
    try {
      await newProjectPage.waitForSuccess();
    } catch {
      // If no success message, check for redirect
      await newProjectPage.waitForRedirect(/\/.*\/work\/.*/);
    }
  });

  test("should handle video link upload", async ({ page }) => {
    const youtubeUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

    await newProjectPage.addVideoLink(youtubeUrl);

    expect(await newProjectPage.getMediaCount()).toBe(1);
    expect(await newProjectPage.isProceedButtonEnabled()).toBe(true);
  });

  test("should handle multiple file uploads", async ({ page }) => {
    const testImage1Path = path.join(__dirname, "fixtures", "test-image.jpg");
    const testImage2Path = path.join(__dirname, "fixtures", "test-video.mp4");

    await newProjectPage.uploadMultipleFiles([testImage1Path, testImage2Path]);

    expect(await newProjectPage.getMediaCount()).toBe(2);
  });

  test("should allow removing media", async ({ page }) => {
    const testImagePath = path.join(__dirname, "fixtures", "test-image.jpg");

    // Upload file
    await newProjectPage.uploadFile(testImagePath);
    expect(await newProjectPage.getMediaCount()).toBe(1);

    // Remove file
    await newProjectPage.removeMedia(0);
    expect(await newProjectPage.getMediaCount()).toBe(0);
    expect(await newProjectPage.isProceedButtonEnabled()).toBe(false);
  });

  test("should navigate between steps", async ({ page }) => {
    const testImagePath = path.join(__dirname, "fixtures", "test-image.jpg");

    // Upload file and proceed
    await newProjectPage.uploadFile(testImagePath);
    await newProjectPage.proceedToDetails();

    expect(await newProjectPage.isInProjectDetailsStep()).toBe(true);

    // Go back
    await newProjectPage.goBackToMedia();

    expect(await newProjectPage.isInMediaUploadStep()).toBe(true);
    expect(await newProjectPage.getMediaCount()).toBe(1); // Media should persist
  });

  test("should validate required fields", async ({ page }) => {
    const testImagePath = path.join(__dirname, "fixtures", "test-image.jpg");

    // Upload file and proceed to details
    await newProjectPage.uploadFile(testImagePath);
    await newProjectPage.proceedToDetails();

    // Try to create project without filling required fields
    await newProjectPage.createProject();

    // Should show validation error
    await newProjectPage.waitForError("title is required");
  });

  test("should handle import from URL", async ({ page }) => {
    const projectUrl = "https://example.com/portfolio";

    await newProjectPage.importFromUrl(projectUrl);

    // Check for import progress
    await expect(newProjectPage.importProgress).toBeVisible();
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Mock API error
    await page.route("**/api/projects", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ success: false, error: "Server error" }),
      });
    });

    const testImagePath = path.join(__dirname, "fixtures", "test-image.jpg");

    // Complete the flow
    await newProjectPage.uploadFile(testImagePath);
    await newProjectPage.proceedToDetails();
    await newProjectPage.fillProjectDetails({
      title: testProject.title,
      shortDescription: testProject.shortDescription,
      year: testProject.year,
    });
    await newProjectPage.createProject();

    // Should show error
    await newProjectPage.waitForError("Server error");
  });

  test("should work on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Reload page with mobile viewport
    await newProjectPage.goto();

    // Should still be functional
    expect(await newProjectPage.isInMediaUploadStep()).toBe(true);

    const testImagePath = path.join(__dirname, "fixtures", "test-image.jpg");
    await newProjectPage.uploadFile(testImagePath);

    expect(await newProjectPage.getMediaCount()).toBe(1);
  });
});
