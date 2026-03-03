# External Integrations Map

## Authentication & Backend Services
- **Firebase**:
  - Auth: Handled via `src/firebase`
  - Database: Firestore (`src/firebase/firestore`)
  - Hosting: App Hosting (`apphosting.yaml`)

## AI & Machine Learning
- **Google AI via Genkit**:
  - Core configuration in `src/ai/genkit.ts`
  - Defines various "flows" in `src/ai/flows/`

## Email & Communication
- **Resend**: 
  - Mentioned in package dependencies (`resend: ^3.2.0`), presumably used for transactional emails.

## Testing & Quality Assurance
- **Playwright**: End-to-end browser testing.
- **TestSprite**: External test orchestration (results in `testsprite_tests`).
