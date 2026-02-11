# Repository Guidelines

## Project Structure & Module Organization
- `src/`: application code (React + TypeScript).
- `src/components/`: UI components (`CanvasViewport.tsx`, `ControlPanel.tsx`, `StatusBar.tsx`).
- `src/lib/`: domain logic (`src/lib/degradation/model.ts`, `src/lib/degradation/engine.ts`).
- `src/types/`: shared type definitions (`domain.ts`).
- Root configs: `vite.config.ts`, `tailwind.config.ts`, `tsconfig*.json`, `postcss.config.js`.
- Build output is generated in `dist/` (do not commit).

## Build, Test, and Development Commands
- `npm install`: install dependencies.
- `npm run dev`: start local dev server (Vite).
- `npm run typecheck`: run strict TypeScript checks (`tsc --noEmit`).
- `npm run build`: type-check and create production build in `dist/`.
- `npm run preview`: preview the built app locally.

Run `npm run typecheck && npm run build` before opening a PR.

## Coding Style & Naming Conventions
- Language: TypeScript with strict mode enabled.
- Indentation: 2 spaces; keep imports grouped and minimal.
- React: functional components + hooks; avoid class components.
- Naming:
  - Components: `PascalCase` (`CanvasViewport.tsx`)
  - Functions/variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE` for global constants, otherwise `camelCase`
- Styling: Tailwind utility-first; keep custom CSS in `src/styles.css` minimal.

## Testing Guidelines
- No automated test framework is configured yet.
- Current minimum quality gate:
  1. `npm run typecheck`
  2. `npm run build`
  3. Manual smoke test via `npm run dev` (upload image, play/pause/reset, split slider, settings persistence).
- If introducing tests, prefer Vitest + React Testing Library and place files as `src/**/*.test.ts(x)`.

## Current Implementation Snapshot (2026-02-11)
- Implemented:
  - JPEG re-encode loop with retry (`toBlob -> decode -> redraw`)
  - Speed and batch combined scheduling
  - Split comparison canvas with draggable slider
  - Metrics display: generation / quality / elapsed / FPS / PSNR / SSIM
  - Settings validation and localStorage schema sanitization
  - Automatic downscale for large images and Blob URL cleanup
- Not implemented yet:
  - Worker + OffscreenCanvas path
  - Full cross-browser verification and long-run endurance report

## Commit & Pull Request Guidelines
- Git history is not established yet (no commits on `main` at this point).
- Adopt Conventional Commits going forward (e.g., `feat: add jpeg degradation loop`, `fix: guard invalid quality values`).
- PRs should include:
  - concise summary of changes
  - related issue/task link
  - validation results (`typecheck`, `build`, and manual checks)
  - UI screenshots/GIFs for visible changes.

## Security & Configuration Notes
- Keep image processing local in-browser; do not add external upload by default.
- Do not commit secrets or environment-specific credentials.
