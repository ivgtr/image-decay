---
name: commit-by-intent
description: Create clean git history by splitting local changes into meaningful commits, running pre-commit quality checks in strict order, and matching the repository's existing commit-message style. Use when users ask to commit changes properly, split commits by intent, or organize diffs into reviewable units.
---

# Commit By Intent

意味単位でコミットを分割し、履歴の可読性と安全性を両立する。

## Preflight Gate

1. `npm run typecheck` を実行する。
2. `npm run lint` を実行する。
3. どちらかが失敗したらコミットを中止する。失敗内容を要約して報告する。
4. `lint` スクリプト未定義など実行不能な場合も失敗扱いとして中止する。

## Workflow (After Preflight Passes)

1. 差分全体を把握する。`git status --short` と `git diff --stat` を確認する。
2. 直近履歴を読む。`git log --oneline -n 20` で prefix と文体を抽出する。
3. 変更を意図単位で分類する。例: 機能追加、バグ修正、リファクタリング、ドキュメント。
4. 1コミット1意図を守る。混在ファイルは `git add -p` で hunk 分割する。
5. ステージ後に `git diff --cached --name-only` と `git diff --cached` で境界を検証する。
6. 履歴スタイルに合わせたメッセージでコミットする。履歴の規則が曖昧なときのみ `references/conventional-commit-guide.md` を使う。
7. コミット直後に `git show --name-status --stat --oneline -1` を確認し、意図境界が崩れていないか再検証する。
8. 未コミット差分が残る場合は 3-7 を繰り返す。

## Mandatory Rules

- 無関係な変更を同じコミットに混ぜない。
- 「見た目変更」と「振る舞い変更」は原則分離する。
- 「リネーム」と「ロジック変更」は原則分離する。
- 自動整形が大規模に入る場合は、整形専用コミットを分離する。
- コミットメッセージに曖昧語（`update`, `misc`, `tweak`）を使わない。
- メッセージの prefix と文体は既存履歴を優先する。

## Output Contract

コミット作業時は次を返す:

1. 事前チェック結果（`typecheck`、`lint` の順）
2. 予定コミット一覧（順序、意図、対象ファイル）
3. 実行したステージング方針（ファイル単位 or hunk単位）
4. 各コミットメッセージと、履歴スタイルへの整合根拠
5. 最終 `git status --short` の要約

## Decision Heuristics

- 先に「依存される基盤変更」をコミットし、その上に機能変更を積む。
- リスクが高い変更（ロジック・状態管理・I/O）を小さいコミットにする。
- レビュー時に「このコミットだけを読む価値があるか」を基準に分割する。

詳細な分割基準と手順は `references/commit-splitting-checklist.md` を参照する。
