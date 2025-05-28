import { Page, Locator, expect } from "@playwright/test";

export class NewProjectPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly mediaUploadStep: Locator;
  readonly projectDetailsStep: Locator;
  readonly fileInput: Locator;
  readonly dropZone: Locator;
  readonly proceedButton: Locator;
  readonly backButton: Locator;
  readonly createProjectButton: Locator;

  // Media upload elements
  readonly linkTab: Locator;
  readonly importTab: Locator;
  readonly mediaLinkInput: Locator;
  readonly addMediaLinkButton: Locator;
  readonly projectUrlInput: Locator;
  readonly importMediaButton: Locator;
  readonly mediaItems: Locator;
  readonly removeMediaButtons: Locator;
  readonly selectThumbnailButtons: Locator;

  // Project details elements
  readonly titleInput: Locator;
  readonly shortDescriptionInput: Locator;
  readonly descriptionInput: Locator;
  readonly rolesSelect: Locator;
  readonly clientsSelect: Locator;
  readonly yearInput: Locator;

  // Status elements
  readonly errorMessages: Locator;
  readonly successMessages: Locator;
  readonly loadingIndicators: Locator;
  readonly importProgress: Locator;

  constructor(page: Page) {
    this.page = page;

    // Main page elements
    this.heading = page.locator("h1");
    this.mediaUploadStep = page.locator('[data-testid="media-upload-step"]');
    this.projectDetailsStep = page.locator(
      '[data-testid="project-details-step"]'
    );
    this.fileInput = page.locator('input[type="file"]').first();
    this.dropZone = page.locator('[data-testid="file-drop-zone"]');
    this.proceedButton = page.locator('[data-testid="proceed-to-details"]');
    this.backButton = page.locator('[data-testid="back-to-media"]');
    this.createProjectButton = page.locator('[data-testid="create-project"]');

    // Media upload elements
    this.linkTab = page.locator('[data-value="link"]');
    this.importTab = page.locator('[data-value="import"]');
    this.mediaLinkInput = page.locator('[data-testid="media-link-input"]');
    this.addMediaLinkButton = page.locator('[data-testid="add-media-link"]');
    this.projectUrlInput = page.locator('[data-testid="project-url-input"]');
    this.importMediaButton = page.locator('[data-testid="import-media"]');
    this.mediaItems = page.locator('[data-testid="media-item"]');
    this.removeMediaButtons = page.locator('[data-testid="remove-media"]');
    this.selectThumbnailButtons = page.locator(
      '[data-testid="select-thumbnail"]'
    );

    // Project details elements
    this.titleInput = page.locator('[data-testid="project-title"]');
    this.shortDescriptionInput = page.locator(
      '[data-testid="project-short-description"]'
    );
    this.descriptionInput = page.locator('[data-testid="project-description"]');
    this.rolesSelect = page.locator('[data-testid="roles-select"]');
    this.clientsSelect = page.locator('[data-testid="clients-select"]');
    this.yearInput = page.locator('[data-testid="project-year"]');

    // Status elements
    this.errorMessages = page.locator('[data-testid="error-message"]');
    this.successMessages = page.locator('[data-testid="success-message"]');
    this.loadingIndicators = page.locator('[data-testid="loading"]');
    this.importProgress = page.locator('[data-testid="import-progress"]');
  }

  async goto() {
    await this.page.goto("/project/new");
    await expect(this.heading).toContainText("Create New Project");
  }

  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  async uploadMultipleFiles(filePaths: string[]) {
    await this.fileInput.setInputFiles(filePaths);
  }

  async addVideoLink(url: string) {
    await this.linkTab.click();
    await this.mediaLinkInput.fill(url);
    await this.addMediaLinkButton.click();
  }

  async importFromUrl(url: string) {
    await this.importTab.click();
    await this.projectUrlInput.fill(url);
    await this.importMediaButton.click();
  }

  async selectThumbnail(index: number = 0) {
    await this.selectThumbnailButtons.nth(index).click();
  }

  async removeMedia(index: number = 0) {
    await this.removeMediaButtons.nth(index).click();
  }

  async proceedToDetails() {
    await this.proceedButton.click();
    await expect(this.projectDetailsStep).toBeVisible();
  }

  async goBackToMedia() {
    await this.backButton.click();
    await expect(this.mediaUploadStep).toBeVisible();
  }

  async fillProjectDetails(projectData: {
    title: string;
    shortDescription: string;
    description?: string;
    roles?: string[];
    clients?: string[];
    year?: number;
  }) {
    await this.titleInput.fill(projectData.title);
    await this.shortDescriptionInput.fill(projectData.shortDescription);

    if (projectData.description) {
      await this.descriptionInput.fill(projectData.description);
    }

    if (projectData.roles) {
      for (const role of projectData.roles) {
        await this.rolesSelect.click();
        await this.page.locator(`[data-value="${role}"]`).click();
        await this.page.keyboard.press("Escape");
      }
    }

    if (projectData.clients) {
      for (const client of projectData.clients) {
        await this.clientsSelect.click();
        await this.page.locator(`[data-value="${client}"]`).click();
        await this.page.keyboard.press("Escape");
      }
    }

    if (projectData.year) {
      await this.yearInput.fill(projectData.year.toString());
    }
  }

  async createProject() {
    await this.createProjectButton.click();
  }

  async waitForSuccess() {
    await expect(this.successMessages).toContainText(
      "Project created successfully"
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

  async getMediaCount(): Promise<number> {
    return await this.mediaItems.count();
  }

  async isProceedButtonEnabled(): Promise<boolean> {
    return await this.proceedButton.isEnabled();
  }

  async isCreateButtonEnabled(): Promise<boolean> {
    return await this.createProjectButton.isEnabled();
  }

  async isInMediaUploadStep(): Promise<boolean> {
    return await this.mediaUploadStep.isVisible();
  }

  async isInProjectDetailsStep(): Promise<boolean> {
    return await this.projectDetailsStep.isVisible();
  }
}
