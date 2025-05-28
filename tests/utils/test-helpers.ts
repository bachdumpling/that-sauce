import { Page, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

export class TestHelpers {
  static async createTestFile(
    filename: string, 
    content: string, 
    mimeType: string = 'text/plain'
  ): Promise<string> {
    const testFilesDir = path.join(__dirname, '..', 'fixtures');
    const filePath = path.join(testFilesDir, filename);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
    
    // Create the test file
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  static async createTestImage(filename: string = 'test-image.jpg'): Promise<string> {
    // Create a minimal JPEG-like file
    const jpegHeader = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
    const jpegFooter = Buffer.from([0xFF, 0xD9]);
    const content = Buffer.concat([jpegHeader, Buffer.alloc(1000, 0x00), jpegFooter]);
    
    const testFilesDir = path.join(__dirname, '..', 'fixtures');
    const filePath = path.join(testFilesDir, filename);
    
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  static async createTestVideo(filename: string = 'test-video.mp4'): Promise<string> {
    // Create a minimal MP4-like file
    const mp4Header = Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]);
    const content = Buffer.concat([mp4Header, Buffer.alloc(1000, 0x00)]);
    
    const testFilesDir = path.join(__dirname, '..', 'fixtures');
    const filePath = path.join(testFilesDir, filename);
    
    if (!fs.existsSync(testFilesDir)) {
      fs.mkdirSync(testFilesDir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content);
    return filePath;
  }

  static async waitForToast(page: Page, message: string, timeout: number = 5000) {
    await expect(page.locator('[data-sonner-toast]')).toContainText(message, { timeout });
  }

  static async waitForLoadingToFinish(page: Page, timeout: number = 10000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async mockApiResponse(
    page: Page, 
    endpoint: string, 
    response: any, 
    status: number = 200
  ) {
    await page.route(endpoint, route => {
      route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  static async mockApiError(page: Page, endpoint: string, error: string, status: number = 500) {
    await this.mockApiResponse(page, endpoint, { success: false, error }, status);
  }

  static async fillFormField(page: Page, selector: string, value: string) {
    await page.locator(selector).fill(value);
    // Wait a bit for any debounced validation
    await page.waitForTimeout(100);
  }

  static async selectFromDropdown(page: Page, triggerSelector: string, optionValue: string) {
    await page.locator(triggerSelector).click();
    await page.locator(`[data-value="${optionValue}"]`).click();
    await page.keyboard.press('Escape'); // Close dropdown
  }

  static async uploadFileToInput(page: Page, inputSelector: string, filePath: string) {
    const fileInput = page.locator(inputSelector);
    await fileInput.setInputFiles(filePath);
  }

  static async dragAndDropFile(page: Page, dropZoneSelector: string, filePath: string) {
    // For now, we'll use the file input method as drag-and-drop is complex to simulate
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(filePath);
  }

  static async takeScreenshotOnFailure(page: Page, testName: string) {
    const screenshotPath = path.join(__dirname, '..', 'screenshots', `${testName}-failure.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Screenshot saved: ${screenshotPath}`);
  }

  static async cleanupTestFiles() {
    const testFilesDir = path.join(__dirname, '..', 'fixtures');
    if (fs.existsSync(testFilesDir)) {
      const files = fs.readdirSync(testFilesDir);
      for (const file of files) {
        if (file.startsWith('test-') || file.startsWith('large-')) {
          fs.unlinkSync(path.join(testFilesDir, file));
        }
      }
    }
  }

  static getTestData() {
    return {
      project: {
        title: 'Test Creative Project',
        shortDescription: 'A test project for automated testing',
        description: 'This is a longer description of the test project that includes more details about the creative work.',
        roles: ['UI/UX Designer', 'Frontend Developer'],
        year: 2024,
      },
      urls: {
        youtube: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        vimeo: 'https://vimeo.com/123456789',
        portfolio: 'https://example.com/portfolio',
      },
      user: {
        email: 'test@example.com',
        password: 'testpassword123',
        username: 'testuser',
      }
    };
  }

  static async waitForNavigation(page: Page, urlPattern: RegExp, timeout: number = 10000) {
    await page.waitForURL(urlPattern, { timeout });
  }

  static async scrollToElement(page: Page, selector: string) {
    await page.locator(selector).scrollIntoViewIfNeeded();
  }

  static async waitForElementToBeVisible(page: Page, selector: string, timeout: number = 5000) {
    await expect(page.locator(selector)).toBeVisible({ timeout });
  }

  static async waitForElementToBeHidden(page: Page, selector: string, timeout: number = 5000) {
    await expect(page.locator(selector)).toBeHidden({ timeout });
  }

  static async getElementCount(page: Page, selector: string): Promise<number> {
    return await page.locator(selector).count();
  }

  static async isElementEnabled(page: Page, selector: string): Promise<boolean> {
    return await page.locator(selector).isEnabled();
  }

  static async isElementVisible(page: Page, selector: string): Promise<boolean> {
    return await page.locator(selector).isVisible();
  }

  static async getElementText(page: Page, selector: string): Promise<string> {
    return await page.locator(selector).textContent() || '';
  }

  static async getInputValue(page: Page, selector: string): Promise<string> {
    return await page.locator(selector).inputValue();
  }
} 