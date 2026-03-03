# Areas of Concern & Tech Debt

## Architecture & Code Organization
- **Component Density**: High concentration of components un-nested within `src/components`, potentially leading to poor discoverability as the app scales.
- **Absence of Unit Tests**: Lack of a formal unit testing framework (like Jest or Vitest). Heavy reliance on E2E (Playwright) or AI-generated testing (TestSprite) may make granular debugging more difficult.

## Technical Debt Tracker
- **Missing Deployment/CI Pipeline**: While `apphosting.yaml` and `.firebaserc` indicate Firebase hosting, no formal Github Actions or CI/CD testing workflow definition appears at a fundamental level.
- **Type Safety Gaps**: To be verified via `tsc --noEmit`. Potential usage of `any` types over strictly defined API payloads.
