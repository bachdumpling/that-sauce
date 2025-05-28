import { test, expect } from "@playwright/test";
import { OnboardingPage } from "./page-objects/onboarding-page";
import { TestHelpers } from "./utils/test-helpers";

test.describe("Onboarding Happy Path", () => {
  let onboardingPage: OnboardingPage;
  let testImagePath: string;

  test.beforeEach(async ({ page }) => {
    onboardingPage = new OnboardingPage(page);

    // Create test image for profile upload
    testImagePath = await TestHelpers.createTestImage("onboarding-profile.jpg");
  });

  test.afterEach(async () => {
    // Clean up test files
    await TestHelpers.cleanupTestFiles();
  });

  test("Creator onboarding flow - complete happy path", async ({ page }) => {
    const testData = TestHelpers.getTestData();
    const timestamp = Date.now();
    const uniqueUsername = `testcreator${timestamp}`;

    // Step 1: Navigate to onboarding
    await onboardingPage.goto();
    await expect(page).toHaveTitle(/Onboarding/);

    // Step 2: Select Creator Role
    await test.step("Select Creator Role", async () => {
      await onboardingPage.selectCreatorRole();
      await onboardingPage.waitForToast("Role selected successfully");

      // Should skip organization step for creators
      expect(await onboardingPage.isStepVisible("profile")).toBe(true);
    });

    // Step 3: Fill Profile Information
    await test.step("Fill Profile Information", async () => {
      await onboardingPage.fillProfileInfo({
        firstName: "John",
        lastName: "Creator",
        bio: "I'm a passionate UI/UX designer with 5 years of experience creating beautiful and functional digital experiences.",
        location: "San Francisco, CA",
        primaryRole: "UI/UX Designer",
        imagePath: testImagePath,
      });

      await onboardingPage.waitForToast("Profile information saved");
      expect(await onboardingPage.isStepVisible("social")).toBe(true);
    });

    // Step 4: Add Social Links
    await test.step("Add Social Links", async () => {
      await onboardingPage.fillSocialLinks({
        instagram: "https://instagram.com/johncreator",
        twitter: "https://twitter.com/johncreator",
        linkedin: "https://linkedin.com/in/johncreator",
        behance: "https://behance.net/johncreator",
        website: "https://johncreator.com",
      });

      await onboardingPage.waitForToast("Social links saved");
      expect(await onboardingPage.isStepVisible("username")).toBe(true);
    });

    // Step 5: Select Username
    await test.step("Select Username", async () => {
      await onboardingPage.selectUsername(uniqueUsername);
      await onboardingPage.waitForToast("Username set successfully");
      expect(await onboardingPage.isStepVisible("completion")).toBe(true);
    });

    // Step 6: Verify Completion
    await test.step("Verify Onboarding Completion", async () => {
      await onboardingPage.waitForCompletion();

      // Check that completion message is displayed
      await expect(onboardingPage.completionMessage).toContainText(
        "Welcome to That Sauce"
      );

      // Verify action buttons are available
      await expect(onboardingPage.viewProfileButton).toBeVisible();
      await expect(onboardingPage.createProjectButton).toBeVisible();
    });

    // Step 7: Navigate to Profile
    await test.step("Navigate to Profile", async () => {
      await onboardingPage.viewProfile();

      // Should redirect to the user's profile page
      await onboardingPage.waitForRedirect(new RegExp(`/${uniqueUsername}`));

      // Verify profile elements are visible
      await expect(page.locator('[data-testid="profile-name"]')).toContainText(
        "John Creator"
      );
      await expect(page.locator('[data-testid="profile-bio"]')).toContainText(
        "passionate UI/UX designer"
      );
      await expect(
        page.locator('[data-testid="profile-location"]')
      ).toContainText("San Francisco, CA");
    });
  });

  test("Employer onboarding flow - complete happy path", async ({ page }) => {
    const testData = TestHelpers.getTestData();
    const timestamp = Date.now();

    // Step 1: Navigate to onboarding
    await onboardingPage.goto();

    // Step 2: Select Employer Role
    await test.step("Select Employer Role", async () => {
      await onboardingPage.selectEmployerRole();
      await onboardingPage.waitForToast("Role selected successfully");

      // Should show organization step for employers
      expect(await onboardingPage.isStepVisible("organization")).toBe(true);
    });

    // Step 3: Fill Organization Information
    await test.step("Fill Organization Information", async () => {
      await onboardingPage.fillOrganizationInfo({
        name: "Acme Design Studio",
        website: "https://acmedesign.com",
      });

      await onboardingPage.waitForToast("Organization information saved");
      expect(await onboardingPage.isStepVisible("profile")).toBe(true);
    });

    // Step 4: Fill Profile Information (simplified for employers)
    await test.step("Fill Profile Information", async () => {
      await onboardingPage.fillProfileInfo({
        firstName: "Jane",
        lastName: "Employer",
        bio: "Talent acquisition specialist at Acme Design Studio, looking for amazing creative professionals.",
        location: "New York, NY",
        imagePath: testImagePath,
      });

      await onboardingPage.waitForToast("Profile information saved");

      // Employers should skip social links and go directly to completion
      expect(await onboardingPage.isStepVisible("completion")).toBe(true);
    });

    // Step 5: Verify Completion
    await test.step("Verify Onboarding Completion", async () => {
      await onboardingPage.waitForCompletion();

      // Check that completion message is displayed
      await expect(onboardingPage.completionMessage).toContainText(
        "Welcome to That Sauce"
      );

      // For employers, should show different action buttons
      await expect(onboardingPage.viewProfileButton).toBeVisible();
      // Employers might have a "Browse Creators" button instead of "Create Project"
    });
  });

  test("Navigation and back button functionality", async ({ page }) => {
    const testData = TestHelpers.getTestData();

    await onboardingPage.goto();

    // Start creator flow
    await onboardingPage.selectCreatorRole();

    // Fill profile info
    await onboardingPage.fillProfileInfo({
      firstName: "Test",
      lastName: "User",
      bio: "Test bio",
      location: "Test City",
      imagePath: testImagePath,
    });

    // Verify we're on social links step
    expect(await onboardingPage.isStepVisible("social")).toBe(true);

    // Test back navigation
    await test.step("Test Back Navigation", async () => {
      await onboardingPage.goBack();

      // Should be back on profile step
      expect(await onboardingPage.isStepVisible("profile")).toBe(true);

      // Form should retain previous values
      await expect(onboardingPage.firstNameInput).toHaveValue("Test");
      await expect(onboardingPage.lastNameInput).toHaveValue("User");
      await expect(onboardingPage.bioInput).toHaveValue("Test bio");
      await expect(onboardingPage.locationInput).toHaveValue("Test City");
    });

    // Continue forward again
    await onboardingPage.profileNextButton.click();
    expect(await onboardingPage.isStepVisible("social")).toBe(true);
  });

  test("Form validation and error handling", async ({ page }) => {
    await onboardingPage.goto();
    await onboardingPage.selectCreatorRole();

    // Test required field validation
    await test.step("Test Required Field Validation", async () => {
      // Try to proceed without filling required fields
      await onboardingPage.profileNextButton.click();

      // Should show validation errors
      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toContainText("First name is required");
      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toContainText("Last name is required");
      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toContainText("Bio is required");
      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toContainText("Location is required");
      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toContainText("Profile picture is required");
    });

    // Test username validation
    await test.step("Test Username Validation", async () => {
      // Fill minimum required fields to get to username step
      await onboardingPage.fillProfileInfo({
        firstName: "Test",
        lastName: "User",
        bio: "Test bio",
        location: "Test City",
        imagePath: testImagePath,
      });

      // Add minimum social links
      await onboardingPage.fillSocialLinks({
        instagram: "https://instagram.com/test",
        twitter: "https://twitter.com/test",
      });

      // Test invalid username
      await onboardingPage.usernameInput.fill("ab"); // Too short
      await expect(onboardingPage.usernameErrorMessage).toContainText(
        "Username must be at least 3 characters"
      );

      await onboardingPage.usernameInput.fill("invalid-username!"); // Invalid characters
      await expect(onboardingPage.usernameErrorMessage).toContainText(
        "Username can only contain letters, numbers, and underscores"
      );

      // Test valid username
      const validUsername = `testuser${Date.now()}`;
      await onboardingPage.usernameInput.fill(validUsername);
      await expect(onboardingPage.usernameSuccessMessage).toContainText(
        "Username is available"
      );
    });
  });

  test("Profile image upload functionality", async ({ page }) => {
    await onboardingPage.goto();
    await onboardingPage.selectCreatorRole();

    await test.step("Test Profile Image Upload", async () => {
      // Test successful image upload
      await onboardingPage.uploadProfileImage(testImagePath);

      // Verify image preview appears
      await expect(onboardingPage.profileImagePreview).toBeVisible();

      // Verify upload success message
      await onboardingPage.waitForToast("Profile image uploaded successfully");
    });

    await test.step("Test Invalid File Type", async () => {
      // Create a text file to test invalid file type
      const textFilePath = await TestHelpers.createTestFile(
        "test.txt",
        "This is not an image"
      );

      // Try to upload text file
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.setInputFiles(textFilePath);

      // Should show error message
      await onboardingPage.waitForToast(
        "Invalid file type. Please upload an image."
      );
    });
  });

  test("Social links validation", async ({ page }) => {
    await onboardingPage.goto();
    await onboardingPage.selectCreatorRole();

    // Fill profile info to get to social links step
    await onboardingPage.fillProfileInfo({
      firstName: "Test",
      lastName: "User",
      bio: "Test bio",
      location: "Test City",
      imagePath: testImagePath,
    });

    await test.step("Test Minimum Social Links Requirement", async () => {
      // Try to proceed with only one social link
      await onboardingPage.instagramInput.fill("https://instagram.com/test");
      await onboardingPage.socialLinksNextButton.click();

      // Should show validation error
      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toContainText("At least 2 social links are required");
    });

    await test.step("Test Invalid URL Format", async () => {
      // Test invalid URL
      await onboardingPage.twitterInput.fill("not-a-valid-url");
      await onboardingPage.socialLinksNextButton.click();

      // Should show validation error
      await expect(
        page.locator('[data-testid="validation-error"]')
      ).toContainText("Please enter a valid URL");
    });

    await test.step("Test Valid Social Links", async () => {
      // Add valid second social link
      await onboardingPage.twitterInput.fill("https://twitter.com/test");
      await onboardingPage.socialLinksNextButton.click();

      // Should proceed to username step
      expect(await onboardingPage.isStepVisible("username")).toBe(true);
    });
  });

  test("Responsive design and mobile experience", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await onboardingPage.goto();

    await test.step("Test Mobile Navigation", async () => {
      // Verify onboarding works on mobile
      await onboardingPage.selectCreatorRole();

      // Check that elements are properly sized for mobile
      const roleButton = onboardingPage.creatorRoleButton;
      const buttonBox = await roleButton.boundingBox();
      expect(buttonBox?.width).toBeGreaterThan(200); // Should be wide enough for touch
      expect(buttonBox?.height).toBeGreaterThan(44); // Should meet minimum touch target size
    });

    await test.step("Test Mobile Form Interaction", async () => {
      // Test form filling on mobile
      await onboardingPage.fillProfileInfo({
        firstName: "Mobile",
        lastName: "User",
        bio: "Testing mobile experience",
        location: "Mobile City",
        imagePath: testImagePath,
      });

      // Verify form elements are accessible on mobile
      await expect(onboardingPage.firstNameInput).toBeVisible();
      await expect(onboardingPage.lastNameInput).toBeVisible();
      await expect(onboardingPage.bioInput).toBeVisible();
    });
  });

  test("Data persistence across page refreshes", async ({ page }) => {
    const timestamp = Date.now();
    const testUsername = `persisttest${timestamp}`;

    await onboardingPage.goto();
    await onboardingPage.selectCreatorRole();

    // Fill profile information
    await onboardingPage.fillProfileInfo({
      firstName: "Persist",
      lastName: "Test",
      bio: "Testing data persistence",
      location: "Persist City",
      imagePath: testImagePath,
    });

    // Refresh the page
    await page.reload();

    // Should maintain progress and data
    await test.step("Verify Data Persistence", async () => {
      // Should be on the correct step
      expect(await onboardingPage.getCurrentStep()).toBe("social");

      // Profile data should be preserved (this depends on implementation)
      // The test assumes the app saves progress to the database
    });
  });
});
