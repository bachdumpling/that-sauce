# Playwright Testing Setup

This directory contains end-to-end tests for the That Sauce creative portfolio platform, specifically focusing on the new project creation flow.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Project dependencies installed (`npm install`)

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with UI mode (interactive)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests step by step
npm run test:debug

# View test report
npm run test:report
```

## 📁 Test Structure

```
tests/
├── fixtures/                    # Test files and data
│   ├── test-image.jpg           # Sample image for upload tests
│   └── test-video.mp4           # Sample video for upload tests
├── page-objects/                # Page Object Model classes
│   └── new-project-page.ts      # New project page interactions
├── utils/                       # Test utilities and helpers
│   └── test-helpers.ts          # Common test functions
├── auth.setup.ts                # Authentication setup
├── new-project-flow.spec.ts     # Main test suite
├── new-project-flow-pom.spec.ts # Tests using Page Object Model
└── README.md                    # This file
```

## 🧪 Test Coverage

### New Project Flow Tests

The test suite covers the complete new project creation workflow:

#### Media Upload Step
- ✅ File upload via drag & drop
- ✅ Multiple file uploads
- ✅ Video link uploads (YouTube/Vimeo)
- ✅ File type validation
- ✅ File size validation
- ✅ Media removal
- ✅ Thumbnail selection
- ✅ Import from external URLs

#### Project Details Step
- ✅ Form field validation
- ✅ Required field checks
- ✅ Role selection
- ✅ Client selection
- ✅ Year input

#### Navigation & Flow
- ✅ Step navigation (back/forward)
- ✅ State persistence between steps
- ✅ Form submission
- ✅ Success handling
- ✅ Error handling

#### Responsive Design
- ✅ Mobile viewport testing
- ✅ Touch interactions

#### API Integration
- ✅ Successful project creation
- ✅ Error response handling
- ✅ Network failure scenarios

## 🎯 Test Data

### Test Files
The tests automatically create temporary test files:
- `test-image.jpg` - Minimal JPEG for image upload tests
- `test-video.mp4` - Minimal MP4 for video upload tests
- `large-image.jpg` - Large file for size validation tests

### Test URLs
- YouTube: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Vimeo: `https://vimeo.com/123456789`
- Portfolio: `https://example.com/portfolio`

### Test Project Data
```typescript
{
  title: 'Test Creative Project',
  shortDescription: 'A test project for automated testing',
  description: 'Detailed description...',
  roles: ['UI/UX Designer', 'Frontend Developer'],
  year: 2024
}
```

## 🏗️ Page Object Model

The tests use the Page Object Model pattern for maintainable and reusable test code:

```typescript
// Example usage
const newProjectPage = new NewProjectPage(page);
await newProjectPage.goto();
await newProjectPage.uploadFile(testImagePath);
await newProjectPage.proceedToDetails();
await newProjectPage.fillProjectDetails(testProject);
await newProjectPage.createProject();
```

### Key Methods
- `goto()` - Navigate to new project page
- `uploadFile(path)` - Upload a single file
- `uploadMultipleFiles(paths)` - Upload multiple files
- `addVideoLink(url)` - Add YouTube/Vimeo link
- `proceedToDetails()` - Move to project details step
- `fillProjectDetails(data)` - Fill out project form
- `createProject()` - Submit the project

## 🛠️ Test Utilities

The `TestHelpers` class provides common testing utilities:

```typescript
// File creation
await TestHelpers.createTestImage('my-image.jpg');
await TestHelpers.createTestVideo('my-video.mp4');

// API mocking
await TestHelpers.mockApiError(page, '**/api/projects', 'Server error');

// Form interactions
await TestHelpers.fillFormField(page, '[data-testid="title"]', 'My Project');
await TestHelpers.selectFromDropdown(page, '[data-testid="roles"]', 'Designer');

// Waiting and assertions
await TestHelpers.waitForToast(page, 'Success message');
await TestHelpers.waitForNavigation(page, /\/work\/.*/);
```

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)
- **Base URL**: `http://localhost:3000`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Retries**: 2 on CI, 0 locally
- **Reporters**: HTML report
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On retry

### Environment Variables
Set these in your `.env.local` or CI environment:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

## 🚨 Test Data Requirements

### Authentication
Update `auth.setup.ts` with valid test credentials:
```typescript
await page.locator('[data-testid="email-input"]').fill('test@example.com');
await page.locator('[data-testid="password-input"]').fill('testpassword123');
```

### Data-TestId Attributes
The tests rely on `data-testid` attributes in the components. Ensure these are present:

#### Media Upload Step
- `media-upload-step` - Main container
- `file-drop-zone` - Drop zone area
- `media-link-input` - Video URL input
- `add-media-link` - Add link button
- `project-url-input` - Import URL input
- `import-media` - Import button
- `media-item` - Individual media items
- `remove-media` - Remove media buttons
- `select-thumbnail` - Thumbnail selection buttons
- `proceed-to-details` - Next step button

#### Project Details Step
- `project-details-step` - Main container
- `project-title` - Title input
- `project-short-description` - Short description input
- `project-description` - Description textarea
- `roles-select` - Roles multi-select
- `clients-select` - Clients multi-select
- `project-year` - Year input
- `back-to-media` - Back button
- `create-project` - Submit button

#### Status Elements
- `error-message` - Error messages
- `success-message` - Success messages
- `loading` - Loading indicators
- `import-progress` - Import progress

## 🔄 CI/CD Integration

### GitHub Actions
The `.github/workflows/playwright.yml` workflow:
- Runs on push/PR to main/develop branches
- Tests on Ubuntu with Node.js LTS
- Installs Playwright browsers
- Runs all tests
- Uploads test reports as artifacts

### Local Development
```bash
# Install Playwright
npm install @playwright/test

# Install browsers
npx playwright install

# Run tests
npm run test

# Debug failing tests
npm run test:debug
```

## 📊 Test Reports

After running tests, view the HTML report:
```bash
npm run test:report
```

The report includes:
- Test results and timing
- Screenshots of failures
- Video recordings of failures
- Trace files for debugging

## 🐛 Debugging

### Debug Mode
```bash
npm run test:debug
```
This opens the Playwright Inspector for step-by-step debugging.

### Screenshots
Failed tests automatically capture screenshots in `test-results/`.

### Traces
Enable trace collection in `playwright.config.ts` for detailed debugging.

## 📝 Writing New Tests

### Basic Test Structure
```typescript
import { test, expect } from '@playwright/test';
import { NewProjectPage } from './page-objects/new-project-page';

test.describe('My Test Suite', () => {
  test('should do something', async ({ page }) => {
    const newProjectPage = new NewProjectPage(page);
    await newProjectPage.goto();
    
    // Your test logic here
    
    await expect(page.locator('h1')).toContainText('Expected Text');
  });
});
```

### Best Practices
1. Use Page Object Model for reusable interactions
2. Use `data-testid` attributes for reliable selectors
3. Wait for elements to be visible before interacting
4. Use meaningful test descriptions
5. Group related tests in `describe` blocks
6. Clean up test data after tests
7. Mock external APIs when possible
8. Test both success and error scenarios

## 🤝 Contributing

When adding new tests:
1. Follow the existing Page Object Model pattern
2. Add appropriate `data-testid` attributes to components
3. Update this README with new test coverage
4. Ensure tests pass in all browsers
5. Add meaningful assertions and error messages

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Guide](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Guide](https://playwright.dev/docs/debug) 