# Commit Splitting Checklist

## 0. Preflight

- `npm run typecheck` を実行する。
- 次に `npm run lint` を実行する。
- どちらかが失敗したらコミットを中止し、失敗内容を報告する。
- `lint` スクリプト未定義も失敗扱いにする。

## 1. Scope Mapping

- 変更ファイルを列挙する。
- 各ファイルに「主目的」を1つ付与する。
- 主目的が2つ以上あるファイルは hunk 分割候補にする。

## 1.5 Message Style Read

- `git log --oneline -n 20` を読み、既存の prefix と文体を把握する。
- メッセージ規則が明確ならそれに合わせる。
- 規則が不明なときのみ Conventional Commits を使う。

## 2. Boundary Test

以下の質問にすべて Yes なら同一コミットに含める:

- 同じレビューコメントで説明できるか?
- 同じ障害原因としてロールバックしたいか?
- 同じテスト観点で検証できるか?

1つでも No なら分割する。

## 3. Staging Strategy

- ファイル単位で分離可能なら `git add <path>` を使う。
- 混在している場合は `git add -p` を使う。
- ステージ後に `git diff --cached` を必ず読む。

## 4. Validation Gate

- 変更タイプに応じて最小限の検証を実行する。
- 検証失敗時はコミットせず修正する。

## 5. Post-Commit Audit

- `git show --name-status --stat -1` を確認する。
- メッセージと実ファイルが一致しているか確認する。
- 境界が崩れていたら直後に修正コミットを重ねるのではなく、可能なら作業手順を見直す。
