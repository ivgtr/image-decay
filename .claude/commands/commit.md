---
description: Create clean, intent-based commits from current changes
---

Use `$commit-by-intent` behavior and execute this workflow strictly.

If `$ARGUMENTS` is provided, treat it as commit scope guidance and prioritize matching files first.

## 1) Preflight (required, in order)

1. Run `npm run typecheck`.
2. Run `npm run lint`.
3. If either command fails (including missing script), stop immediately and report the failure. Do not create any commit.

## 2) Plan commit boundaries

1. Inspect current changes: `git status --short` and `git diff --stat`.
2. Inspect recent history style: `git log --oneline -n 20`.
3. Split changes into semantic units (feature, fix, refactor, docs, etc.).
4. Never mix unrelated changes in a single commit.

## 3) Stage and commit by intent

For each planned commit:

1. Stage only relevant hunks/files (`git add -p` when needed).
2. Verify staged set with:
   - `git diff --cached --name-only`
   - `git diff --cached`
3. Write commit message in the repository's existing style (prefix + tone). Use Conventional Commits only as fallback when style is unclear.
4. Commit.
5. Verify with `git show --name-status --stat --oneline -1`.

## 4) Final report

Return:

1. Preflight results (`typecheck`, `lint`).
2. Commit list (message + files).
3. Remaining unstaged/uncommitted changes (`git status --short`).
