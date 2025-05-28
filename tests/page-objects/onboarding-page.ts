import { Page, Locator, expect } from "@playwright/test";

export class OnboardingPage {
  readonly page: Page;
  readonly heading: Locator;

  // Role Selection Step
  readonly roleSelectionStep: Locator;
  readonly creatorRoleButton: Locator;
  readonly employerRoleButton: Locator;
  readonly roleNextButton: Locator;

  // Organization Info Step (for employers)
  readonly organizationStep: Locator;
  readonly organizationNameInput: Locator;
  readonly organizationWebsiteInput: Locator;
  readonly organizationNextButton: Locator;

  // Profile Info Step
  readonly profileInfoStep: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly bioInput: Locator;
  readonly locationInput: Locator;
  readonly primaryRoleSelect: Locator;
  readonly profileImageUpload: Locator;
  readonly profileImagePreview: Locator;
  readonly profileNextButton: Locator;

  // Social Links Step
  readonly socialLinksStep: Locator;
  readonly instagramInput: Locator;
  readonly twitterInput: Locator;
  readonly linkedinInput: Locator;
  readonly behanceInput: Locator;
  readonly dribbbleInput: Locator;
  readonly websiteInput: Locator;
  readonly socialLinksNextButton: Locator;

  // Username Selection Step
  readonly usernameStep: Locator;
  readonly usernameInput: Locator;
  readonly usernameAvailabilityIndicator: Locator;
  readonly usernameErrorMessage: Locator;
  readonly usernameSuccessMessage: Locator;
  readonly usernameSubmitButton: Locator;

  // Completion Step
  readonly completionStep: Locator;
  readonly completionMessage: Locator;
  readonly viewProfileButton: Locator;
  readonly createProjectButton: Locator;

  // Navigation
  readonly backButton: Locator;
  readonly nextButton: Locator;
  readonly skipButton: Locator;

  // Status elements
  readonly errorMessages: Locator;
  readonly successMessages: Locator;
  readonly loadingIndicators: Locator;
  readonly progressIndicator: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main elements
    this.heading = page.locator("h1");

    // Role Selection Step
    this.roleSelectionStep = page.locator(
      '[data-testid="role-selection-step"]'
    );
    this.creatorRoleButton = page.locator(
      '[data-testid="creator-role-button"]'
    );
    this.employerRoleButton = page.locator(
      '[data-testid="employer-role-button"]'
    );
    this.roleNextButton = page.locator('[data-testid="role-next-button"]');

    // Organization Info Step
    this.organizationStep = page.locator('[data-testid="organization-step"]');
    this.organizationNameInput = page.locator(
      '[data-testid="organization-name"]'
    );
    this.organizationWebsiteInput = page.locator(
      '[data-testid="organization-website"]'
    );
    this.organizationNextButton = page.locator(
      '[data-testid="organization-next-button"]'
    );

    // Profile Info Step
    this.profileInfoStep = page.locator('[data-testid="profile-info-step"]');
    this.firstNameInput = page.locator('[data-testid="first-name"]');
    this.lastNameInput = page.locator('[data-testid="last-name"]');
    this.bioInput = page.locator('[data-testid="bio"]');
    this.locationInput = page.locator('[data-testid="location"]');
    this.primaryRoleSelect = page.locator(
      '[data-testid="primary-role-select"]'
    );
    this.profileImageUpload = page.locator(
      '[data-testid="profile-image-upload"]'
    );
    this.profileImagePreview = page.locator(
      '[data-testid="profile-image-preview"]'
    );
    this.profileNextButton = page.locator(
      '[data-testid="profile-next-button"]'
    );

    // Social Links Step
    this.socialLinksStep = page.locator('[data-testid="social-links-step"]');
    this.instagramInput = page.locator('[data-testid="instagram-input"]');
    this.twitterInput = page.locator('[data-testid="twitter-input"]');
    this.linkedinInput = page.locator('[data-testid="linkedin-input"]');
    this.behanceInput = page.locator('[data-testid="behance-input"]');
    this.dribbbleInput = page.locator('[data-testid="dribbble-input"]');
    this.websiteInput = page.locator('[data-testid="website-input"]');
    this.socialLinksNextButton = page.locator(
      '[data-testid="social-links-next-button"]'
    );

    // Username Selection Step
    this.usernameStep = page.locator('[data-testid="username-step"]');
    this.usernameInput = page.locator('[data-testid="username-input"]');
    this.usernameAvailabilityIndicator = page.locator(
      '[data-testid="username-availability"]'
    );
    this.usernameErrorMessage = page.locator('[data-testid="username-error"]');
    this.usernameSuccessMessage = page.locator(
      '[data-testid="username-success"]'
    );
    this.usernameSubmitButton = page.locator(
      '[data-testid="username-submit-button"]'
    );

    // Completion Step
    this.completionStep = page.locator('[data-testid="completion-step"]');
    this.completionMessage = page.locator('[data-testid="completion-message"]');
    this.viewProfileButton = page.locator(
      '[data-testid="view-profile-button"]'
    );
    this.createProjectButton = page.locator(
      '[data-testid="create-project-button"]'
    );

    // Navigation
    this.backButton = page.locator('[data-testid="back-button"]');
    this.nextButton = page.locator('[data-testid="next-button"]');
    this.skipButton = page.locator('[data-testid="skip-button"]');

    // Status elements
    this.errorMessages = page.locator('[data-testid="error-message"]');
    this.successMessages = page.locator('[data-testid="success-message"]');
    this.loadingIndicators = page.locator('[data-testid="loading"]');
    this.progressIndicator = page.locator('[data-testid="progress-indicator"]');
  }

  async goto() {
    await this.page.goto("/onboarding");
    await expect(this.heading).toBeVisible();
  }

  async selectCreatorRole() {
    await expect(this.roleSelectionStep).toBeVisible();
    await this.creatorRoleButton.click();
    await this.roleNextButton.click();
  }

  async selectEmployerRole() {
    await expect(this.roleSelectionStep).toBeVisible();
    await this.employerRoleButton.click();
    await this.roleNextButton.click();
  }

  async fillOrganizationInfo(orgData: { name: string; website?: string }) {
    await expect(this.organizationStep).toBeVisible();
    await this.organizationNameInput.fill(orgData.name);

    if (orgData.website) {
      await this.organizationWebsiteInput.fill(orgData.website);
    }

    await this.organizationNextButton.click();
  }

  async uploadProfileImage(imagePath: string) {
    const fileInput = this.page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(imagePath);

    // Wait for image to be uploaded and preview to appear
    await expect(this.profileImagePreview).toBeVisible();
  }

  async fillProfileInfo(profileData: {
    firstName: string;
    lastName: string;
    bio: string;
    location: string;
    primaryRole?: string;
    imagePath?: string;
  }) {
    await expect(this.profileInfoStep).toBeVisible();

    // Upload profile image first if provided
    if (profileData.imagePath) {
      await this.uploadProfileImage(profileData.imagePath);
    }

    await this.firstNameInput.fill(profileData.firstName);
    await this.lastNameInput.fill(profileData.lastName);
    await this.bioInput.fill(profileData.bio);
    await this.locationInput.fill(profileData.location);

    if (profileData.primaryRole) {
      await this.primaryRoleSelect.click();
      await this.page
        .locator(`[data-value="${profileData.primaryRole}"]`)
        .click();
      await this.page.keyboard.press("Escape");
    }

    await this.profileNextButton.click();
  }

  async fillSocialLinks(socialData: {
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    behance?: string;
    dribbble?: string;
    website?: string;
  }) {
    await expect(this.socialLinksStep).toBeVisible();

    if (socialData.instagram) {
      await this.instagramInput.fill(socialData.instagram);
    }

    if (socialData.twitter) {
      await this.twitterInput.fill(socialData.twitter);
    }

    if (socialData.linkedin) {
      await this.linkedinInput.fill(socialData.linkedin);
    }

    if (socialData.behance) {
      await this.behanceInput.fill(socialData.behance);
    }

    if (socialData.dribbble) {
      await this.dribbbleInput.fill(socialData.dribbble);
    }

    if (socialData.website) {
      await this.websiteInput.fill(socialData.website);
    }

    await this.socialLinksNextButton.click();
  }

  async selectUsername(username: string) {
    await expect(this.usernameStep).toBeVisible();
    await this.usernameInput.fill(username);

    // Wait for username availability check
    await expect(this.usernameAvailabilityIndicator).toBeVisible();
    await expect(this.usernameSuccessMessage).toContainText(
      "Username is available"
    );

    await this.usernameSubmitButton.click();
  }

  async waitForCompletion() {
    await expect(this.completionStep).toBeVisible();
    await expect(this.completionMessage).toContainText("Welcome to That Sauce");
  }

  async viewProfile() {
    await this.viewProfileButton.click();
  }

  async createFirstProject() {
    await this.createProjectButton.click();
  }

  async goBack() {
    await this.backButton.click();
  }

  async waitForToast(message: string, timeout: number = 5000) {
    await expect(this.page.locator("[data-sonner-toast]")).toContainText(
      message,
      { timeout }
    );
  }

  async waitForError(errorText?: string) {
    if (errorText) {
      await expect(this.errorMessages).toContainText(errorText);
    } else {
      await expect(this.errorMessages).toBeVisible();
    }
  }

  async waitForRedirect(pattern: RegExp, timeout: number = 10000) {
    await this.page.waitForURL(pattern, { timeout });
  }

  async isStepVisible(
    step:
      | "role"
      | "organization"
      | "profile"
      | "social"
      | "username"
      | "completion"
  ): Promise<boolean> {
    const stepLocators = {
      role: this.roleSelectionStep,
      organization: this.organizationStep,
      profile: this.profileInfoStep,
      social: this.socialLinksStep,
      username: this.usernameStep,
      completion: this.completionStep,
    };

    return await stepLocators[step].isVisible();
  }

  async isNextButtonEnabled(): Promise<boolean> {
    return await this.nextButton.isEnabled();
  }

  async getCurrentStep(): Promise<string> {
    const steps = [
      { name: "role", locator: this.roleSelectionStep },
      { name: "organization", locator: this.organizationStep },
      { name: "profile", locator: this.profileInfoStep },
      { name: "social", locator: this.socialLinksStep },
      { name: "username", locator: this.usernameStep },
      { name: "completion", locator: this.completionStep },
    ];

    for (const step of steps) {
      if (await step.locator.isVisible()) {
        return step.name;
      }
    }

    return "unknown";
  }
}
