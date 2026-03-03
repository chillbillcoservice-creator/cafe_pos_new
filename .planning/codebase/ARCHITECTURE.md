# Architecture Map

## Pattern and Layers
- **Framework Architecture**: Next.js App Router combining Server Components for initial load and SEO, with Client Components (`"use client"`) for interactivity.
- **State Management**: React Context API (`src/contexts/`) handles global application state (e.g., cart, auth, POS session).
- **Data Access**: Firebase acts as the backend-as-a-service (BaaS), using Firestore for the database. Reads and writes are largely localized within `src/firebase/firestore`.
- **UI Components**: Radix UI provides the unstyled, accessible component primitives. Tailwind CSS is used for styling these primitives into a cohesive look.

## Data Flow
- **Client to Firebase**: Most data fetching and updates happen client-side through direct Firebase SDK calls (or custom hooks wrapping them).
- **AI to Client**: Genkit handles AI feature requests, exposing callable flows that the client consumes.

## Entry Points
- Web Application: `src/app/page.tsx` and `src/app/layout.tsx`
- API / Serverless endpoints (AI): Genkit exposed serverlessly
