# Repository Guidelines

## Project Structure & Module Organization
This is a Next.js 16 App Router project. Route handlers, layouts, and server/client components live under `app/`. Shared UI primitives and complex widgets sit in `components/`, while reusable hooks belong in `hooks/` (preface files with `use-`). Cross-cutting utilities—API helpers, constants, schema validation—reside in `lib/`. Static assets, fonts, and icons should be placed in `public/`. Keep storybook-style playgrounds or sandboxes inside the feature folder they document.

## Build, Test, and Development Commands
Run `npm install` once, then use `npm run dev` for the local dev server (hot reload via Next). `npm run build` produces the optimized production bundle and catches type/lint issues, and `npm run start` serves that bundle locally for smoke testing. `npm run lint` executes ESLint using `eslint.config.mjs`; run it before pushing to avoid CI failures.

## Coding Style & Naming Conventions
Code is TypeScript-first; enable `strict` assumptions even when files are `.tsx`. Favor server components unless a hook or browser API forces `"use client"`. Use 2-space indentation, descriptive PascalCase for components, camelCase for helpers, and SCREAMING_SNAKE_CASE for shared constants. Tailwind CSS 4 utilities, `clsx`, and `tailwind-merge` are the default styling stack—keep classnames declarative and colocated with components. Let ESLint and the Next.js rules enforce import order and React best practices.

## Testing Guidelines
No automated tests exist yet; start by colocating component tests in `components/__tests__/` (React Testing Library + Jest via `next/jest`). Mock network calls in `lib/` and snapshot complex layouts sparingly. Integration tests that touch routing or forms should live alongside the relevant route inside `app/(feature)/__tests__/`. Strive for meaningful coverage on user flows rather than exhaustive snapshotting, and document new commands in `package.json` when adding the tooling.

## Commit & Pull Request Guidelines
Write concise, present-tense commit subjects (e.g., `feat: add habit timeline chart`) and include context-rich bodies when the change isn't obvious. Every pull request should explain the problem, the solution, and verification steps. Attach screenshots or recordings for visible UI changes, link Linear issues, and note any TODOs or follow-up tickets. Keep PRs scoped to a single feature or bugfix to simplify review.

## Security & Configuration Tips
Environment configuration belongs in `.env.local`, never committed. Prefix any value required on the client with `NEXT_PUBLIC_`. Audit dependencies when introducing new packages, and prefer server actions over exposing tokens to the browser. Review `next.config.ts` before enabling experimental flags.
