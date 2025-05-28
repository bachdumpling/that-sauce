# Testing Project Actions with Jest

This guide explains how to write comprehensive unit tests for your Next.js server actions using Jest.

## Setup

### 1. Dependencies

The following dependencies are required for testing:

```json
{
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "jest-environment-node": "^29.7.0",
    "ts-jest": "^29.1.2"
  }
}
```

### 2. Configuration Files

#### `jest.config.js`

```javascript
/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>"],
  testMatch: [
    "**/__tests__/**/*.+(ts|tsx|js)",
    "**/*.(test|spec).+(ts|tsx|js)",
  ],
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
  },
  collectCoverageFrom: [
    "actions/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "utils/**/*.{ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
  ],
  moduleNameMapping: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testTimeout: 10000,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};

module.exports = config;
```

#### `jest.setup.js`

```javascript
// Global test setup
global.console = {
  ...console,
  // Suppress console.log in tests unless explicitly needed
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock Next.js modules
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("Not Found");
  }),
  redirect: jest.fn(),
}));

// Mock environment variables
process.env.NODE_ENV = "test";
```

### 3. Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:unit": "jest",
    "test:unit:watch": "jest --watch",
    "test:unit:coverage": "jest --coverage"
  }
}
```

## Writing Tests for Server Actions

### Basic Test Structure

```typescript
import { yourAction } from "../your-actions";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

// Mock dependencies
jest.mock("@/utils/supabase/server");
jest.mock("next/cache");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockRevalidatePath = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

describe("Your Action", () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create chainable mock Supabase client
    mockSupabase = {
      auth: { getUser: jest.fn() },
      from: jest.fn(() => mockSupabase),
      select: jest.fn(() => mockSupabase),
      insert: jest.fn(() => mockSupabase),
      update: jest.fn(() => mockSupabase),
      delete: jest.fn(() => mockSupabase),
      eq: jest.fn(() => mockSupabase),
      single: jest.fn(() => mockSupabase),
      order: jest.fn(() => mockSupabase),
      range: jest.fn(() => mockSupabase),
    };

    mockCreateClient.mockResolvedValue(mockSupabase);
  });

  it("should handle success case", async () => {
    // Setup mocks
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: { id: "result-1", title: "Test" },
      error: null,
    });

    // Execute action
    const result = await yourAction("test-input");

    // Assertions
    expect(result.success).toBe(true);
    if (result.success && result.data) {
      expect(result.data.id).toBe("result-1");
    }
  });
});
```

### Key Testing Patterns

#### 1. Authentication Testing

```typescript
describe("Authentication", () => {
  it("should return error when user not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });

    const result = await yourAction("input");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Authentication required");
  });
});
```

#### 2. Authorization Testing

```typescript
describe("Authorization", () => {
  it("should return error when user does not own resource", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: { creators: { profile_id: "different-user" } },
      error: null,
    });

    const result = await yourAction("resource-id");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Access denied");
  });
});
```

#### 3. Database Error Handling

```typescript
describe("Error Handling", () => {
  it("should handle database errors gracefully", async () => {
    mockSupabase.single.mockResolvedValue({
      data: null,
      error: { message: "Database constraint violation" },
    });

    const result = await yourAction("input");

    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to");
  });

  it("should handle unexpected errors", async () => {
    mockSupabase.single.mockRejectedValue(new Error("Network error"));

    const result = await yourAction("input");

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });
});
```

#### 4. Input Validation Testing

```typescript
describe("Input Validation", () => {
  it("should return error for invalid input", async () => {
    const result = await yourAction(""); // Empty input

    expect(result.success).toBe(false);
    expect(result.error).toContain("required");
  });
});
```

#### 5. Side Effects Testing

```typescript
describe("Side Effects", () => {
  it("should revalidate correct paths after successful operation", async () => {
    // Setup successful operation
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    mockSupabase.single.mockResolvedValue({
      data: { id: "new-resource" },
      error: null,
    });

    await yourAction("input");

    expect(mockRevalidatePath).toHaveBeenCalledWith("/path", "layout");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/path/sub", "page");
  });
});
```

### Type-Safe Testing

For better type safety in tests, use type guards:

```typescript
it("should return typed data on success", async () => {
  const result = await yourAction("input");

  expect(result.success).toBe(true);

  // Type-safe assertion
  if (result.success && result.data) {
    expect(result.data.id).toBe("expected-id");
    expect(result.data.title).toBe("Expected Title");
  } else {
    fail("Expected successful result with data");
  }
});
```

### Testing Complex Scenarios

#### Multiple Database Calls

```typescript
it("should handle multiple database operations", async () => {
  // Mock multiple sequential calls
  mockSupabase.single
    .mockResolvedValueOnce({ data: { id: "creator-1" }, error: null })
    .mockResolvedValueOnce({ data: { id: "portfolio-1" }, error: null })
    .mockResolvedValueOnce({ data: { id: "new-project" }, error: null });

  const result = await createProjectAction("username", projectData);

  expect(result.success).toBe(true);
  expect(mockSupabase.single).toHaveBeenCalledTimes(3);
});
```

#### File Operations

```typescript
it("should handle file deletion in cascade delete", async () => {
  mockSupabase.select.mockResolvedValueOnce({
    data: [{ url: "https://example.com/storage/media/file1.jpg" }],
    error: null,
  });

  mockSupabase.storage.from().remove.mockResolvedValue({ error: null });

  const result = await deleteProjectAction("username", "project-id", true);

  expect(result.success).toBe(true);
  expect(mockSupabase.storage.from().remove).toHaveBeenCalledWith([
    "file1.jpg",
  ]);
});
```

## Running Tests

### Basic Commands

```bash
# Run all unit tests
npm run test:unit

# Run tests in watch mode
npm run test:unit:watch

# Run tests with coverage
npm run test:unit:coverage

# Run specific test file
npm run test:unit -- project-actions.test.ts

# Run tests matching pattern
npm run test:unit -- --testNamePattern="create"
```

### Coverage Reports

Jest will generate coverage reports in the `coverage/` directory. Key metrics to monitor:

- **Statements**: Percentage of statements executed
- **Branches**: Percentage of conditional branches tested
- **Functions**: Percentage of functions called
- **Lines**: Percentage of lines executed

Aim for:

- 90%+ statement coverage
- 85%+ branch coverage
- 90%+ function coverage

### Best Practices

1. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
2. **Mock Management**: Reset mocks between tests
3. **Error Testing**: Test both success and failure paths
4. **Edge Cases**: Test boundary conditions and invalid inputs
5. **Type Safety**: Use TypeScript assertions for better type checking
6. **Isolation**: Each test should be independent
7. **Descriptive Names**: Use clear, descriptive test names
8. **Setup/Teardown**: Use `beforeEach`/`afterEach` for common setup

### Common Pitfalls

1. **Forgetting to mock dependencies**: Always mock external dependencies
2. **Not testing error paths**: Test both success and failure scenarios
3. **Shared state**: Avoid sharing state between tests
4. **Over-mocking**: Don't mock what you're testing
5. **Insufficient assertions**: Test all important aspects of the result

### Integration with CI/CD

Add to your GitHub Actions workflow:

```yaml
- name: Run unit tests
  run: npm run test:unit

- name: Upload coverage reports
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

This setup provides comprehensive testing for your Next.js server actions, ensuring reliability and maintainability of your codebase.
