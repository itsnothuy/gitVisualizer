# Unit Tests

Unit tests for Git Visualizer components and utilities using Vitest and React Testing Library.

## Running Tests

```bash
# Run all unit tests
pnpm test

# Watch mode (for development)
pnpm test -- --watch

# Run with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test app-header
```

## Test Structure

Unit tests are co-located with the code they test in `__tests__` directories:

```
src/
  components/
    layout/
      __tests__/
        app-header.test.tsx
      app-header.tsx
```

## Writing Tests

All unit tests should:
1. Test component behavior, not implementation details
2. Use semantic queries from Testing Library (getByRole, getByLabelText, etc.)
3. Include accessibility assertions (ARIA roles, labels)
4. Be fast and isolated
5. Follow the AAA pattern (Arrange, Act, Assert)

## Example Test

```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MyComponent } from "../my-component";

describe("MyComponent", () => {
  it("renders with correct accessibility attributes", () => {
    render(<MyComponent />);
    const element = screen.getByRole("button", { name: /click me/i });
    expect(element).toBeInTheDocument();
  });
});
```

## Configuration

- `vitest.config.ts` - Vitest configuration
- `vitest.setup.ts` - Global test setup and matchers
