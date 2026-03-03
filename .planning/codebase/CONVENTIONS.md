# Coding Conventions

## Language
- **TypeScript Strict Mode**: The codebase employs TypeScript. Types and interfaces appear to be consistently defined.
- **Imports**: Usage of `import type` where possible to keep bundle sizes optimized.

## Styling
- **Utility-First CSS**: Tailwind CSS dictates standard margins, paddings, typography, and colors.
- **Class Merging**: A custom `cn()` utility (usually derived from `clsx` and `tailwind-merge`) is the established convention to merge Tailwind class names safely avoiding stylistic conflicts.
- **Icons**: Lucide React icons are used extensively across the UI.

## React & Components
- **Hooks**: Standard React hooks (`useState`, `useEffect`) and custom hooks are separated into `src/hooks/`.
- **Form Handling**: Complex forms are uniformly handled using `react-hook-form` paired with `zod` schema resolvers.
- **Radix UI**: Foundational UI structures (dropdowns, dialogs, popovers, select, etc.) depend on `@radix-ui` generic primitives.

## Data Access
- **Firebase Initialization and Abstraction**: Avoid direct calls to Firebase globally scattered throughout components. Usually confined within context providers or specific service files.
