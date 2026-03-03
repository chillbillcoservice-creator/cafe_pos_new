# Structure Map

## Directory Layout

```text
├── src/
│   ├── ai/          # Genkit configurations and AI flows
│   ├── app/         # Next.js App Router (pages and layouts)
│   ├── components/  # Reusable React components (UI and specialized)
│   ├── contexts/    # React Context providers for global state
│   ├── data/        # Shared constants or predefined data
│   ├── firebase/    # Firebase SDK initialization and Firestore logic
│   ├── hooks/       # Custom React hooks
│   └── lib/         # General utility functions (e.g., clsx styling utils)
├── tests/           # Playwright End-to-End tests
└── testsprite_tests/# External TestSprite testing suite config
```

## Key Locations
- **Styling Utility**: `src/lib/` generally includes a `utils.ts` (or similar) exposing a `cn()` function combining `clsx` and `tailwind-merge`.
- **Firebase Config**: `src/firebase/config.ts` and providers for integrating Firebase with React.
- **Playwright Config**: `playwright.config.ts` at the root.
- **Component Primitives**: Typically reside directly in `src/components/`, though may be grouped or flat.
