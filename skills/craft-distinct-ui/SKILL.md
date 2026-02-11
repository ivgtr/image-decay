---
name: craft-distinct-ui
description: Build distinctive modern frontend designs with explicit art direction, typography hierarchy, color systems, layout rules, and anti-generic constraints. Use when users request UI/UX or frontend design work and want to avoid AI-looking, template-like, or bland outputs across landing pages, dashboards, admin tools, and redesign tasks.
---

# Craft Distinct UI

Create a concrete art direction before writing component code.

## Workflow

1. Define intent in one sentence: user type, product tone, and business action.
2. Choose exactly one primary direction from `references/art-directions.md`.
3. Define a token set first: typography, spacing scale, radius, border weight, shadow, and color roles.
4. Implement one strong visual motif that appears in at least three places.
5. Build layout with clear rhythm: dense areas + breathing areas, not uniform spacing everywhere.
6. Add motion only where it supports meaning: entry hierarchy, state change, or cause/effect.
7. Run the quality gate in `references/quality-gate.md` before final output.

## Output Contract

Return these items when generating a design:

1. Chosen direction and short rationale.
2. Token snapshot (font stack, palette roles, spacing/radius scale).
3. Key layout decisions for desktop and mobile.
4. Reusable component rules (cards, buttons, nav, section headers).
5. Final implementation code.

## Execution Rules

- Preserve the existing design system when the repository already has one.
- Avoid default-safe stacks (`Inter`, `Roboto`, `Arial`, plain system-only stacks) unless explicitly required.
- Avoid purple-first palettes and dark-mode-first assumptions unless requested.
- Avoid generic hero + three cards + gradient blob composition unless justified by product requirements.
- Prefer bold but readable contrast, intentional whitespace shifts, and visible hierarchy breaks.
