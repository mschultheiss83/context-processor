# Contributing to Context Processor

Thank you for your interest in contributing to the Context Processor! This document provides guidelines and instructions for contributing.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please treat all members respectfully and professionally.

## Getting Started

### Prerequisites
- Node.js 16.0.0 or higher
- npm 7.0.0 or higher
- Git

### Setting Up Development Environment

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/context-processor.git
   cd context-processor
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Building
```bash
npm run build
```

### Running Tests
```bash
npm test
npm run test:coverage  # With coverage report
npm run test:watch    # Watch mode
```

Run specific test scenarios:
```bash
npm run test:scenario1  # Context lifecycle tests
npm run test:scenario2  # Pre-processing strategy tests
npm run test:scenario3  # Complex workflow tests
```

### Linting and Formatting
We use TypeScript strict mode. Ensure your code:
- Has no TypeScript errors: `npm run build` must succeed
- Passes all tests: `npm test` must pass
- Includes JSDoc comments for public APIs
- Follows the existing code style

## Making Changes

### Code Style
- Use 2-space indentation
- Use TypeScript strict mode (no `any` types)
- Add JSDoc comments for exported functions and classes
- Use meaningful variable and function names
- Keep functions focused and single-purpose

### Adding Features

1. Create a test first (TDD approach):
   ```bash
   npm test -- --watch
   ```

2. Implement the feature to pass the test

3. Update documentation if adding new features

4. Ensure all tests pass: `npm test`

5. Build successfully: `npm run build`

### Adding Tests

- Add unit tests to the appropriate `tests/scenario-*.test.ts` file
- Use the test utilities from `tests/test-utils.ts`
- Follow the AAA pattern: Arrange, Act, Assert
- Test both happy path and edge cases
- Ensure test names are descriptive

Example:
```typescript
test("should clarify vague language in content", async () => {
  // Arrange
  const vagueContent = "The system basically provides features.";

  // Act
  const result = await helper.testClarifyStrategy(vagueContent);

  // Assert
  expect(result.processed).toContain("CLARIFICATION");
  expect(result.results[0].strategy).toBe("clarify");
});
```

### Adding Pre-processing Strategies

To add a new pre-processing strategy:

1. Define the strategy type in `src/types.ts`
2. Implement the strategy method in `src/preprocessor.ts`
3. Add tests in `tests/scenario-2-strategies.test.ts`
4. Document in `README.md`
5. Add to `context-models.json` configuration

## Submitting Changes

### Commits
- Use clear, descriptive commit messages
- Reference issue numbers when applicable: `Fixes #123`
- Keep commits focused on a single change
- Use conventional commit format when possible:
  ```
  feat: add new clarity detection pattern
  fix: resolve search strategy word filter bug
  docs: update strategy documentation
  test: add comprehensive edge case tests
  ```

### Pull Requests

1. Push your feature branch:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Create a Pull Request on GitHub with:
   - Clear title and description
   - Reference to related issues
   - List of changes
   - Test evidence

3. Ensure CI checks pass

4. Respond to review feedback

5. Keep PR focused - avoid mixing unrelated changes

## Reporting Issues

### Bug Reports
Use the [Bug Report](/.github/ISSUE_TEMPLATE/bug_report.md) template and include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error output/stack trace

### Feature Requests
Use the [Feature Request](/.github/ISSUE_TEMPLATE/feature_request.md) template and include:
- Clear description of the feature
- Use cases and examples
- Why this feature is needed
- Possible implementation approach

### Documentation Issues
Use the [Documentation](/.github/ISSUE_TEMPLATE/documentation.md) template and include:
- Which document(s) have issues
- What's wrong or missing
- Suggested fix

## Testing Guidelines

### Test Coverage
- Maintain at least 85% code coverage
- Test all public APIs
- Include edge cases and error conditions
- Test integration between components

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific scenario
npm run test:scenario1

# Watch mode
npm run test:watch

# Verbose output
npm run test:verbose
```

## Documentation

- Update relevant documentation files when making changes
- Include examples for new features
- Keep README.md up to date
- Add JSDoc comments to exported APIs
- Update CHANGELOG when appropriate

## Review Process

All submissions require review before merging:

1. Code review: At least one maintainer review required
2. Tests: All tests must pass
3. Build: Project must build successfully
4. Documentation: Relevant docs must be updated

## Release Process

Releases follow semantic versioning:
- Major (X.0.0): Breaking changes
- Minor (1.X.0): New features (backwards compatible)
- Patch (1.0.X): Bug fixes

To prepare a release:
1. Update version in `package.json`
2. Update CHANGELOG
3. Create annotated git tag: `git tag -a vX.X.X -m "Release vX.X.X"`
4. Push tag: `git push origin vX.X.X`
5. CI/CD will handle npm publishing

## Questions or Need Help?

- Check existing issues and documentation
- Open a discussion or issue
- Contact the maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Context Processor!
