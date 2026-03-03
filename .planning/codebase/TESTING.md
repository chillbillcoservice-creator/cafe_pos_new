# Testing Map

## Frameworks
- **Playwright**: End-to-end (E2E) UI testing framework (`@playwright/test`). Primary means of automated verification.
- **TestSprite**: External test orchestration suite used to generate and review tests (output found in `testsprite_tests`).

## Test Structure & Execution
- **Location**: E2E test files are rooted in the `/tests/` directory (e.g., `tests/customer-order.spec.ts`, as indicated in recent conversation logs).
- **External Specs**: Test suites and reports mapped from TestSprite in `testsprite_tests/` (e.g., `testsprite_tests/testsprite-mcp-test-report.md`).
- **Unit Testing**: Notable absence of standard unit testing libraries like `Jest` or `Vitest` in `package.json`. Tests are predominantly focused on broad flow validation via Playwright and AI test generation.
