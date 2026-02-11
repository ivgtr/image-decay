# Conventional Commit Guide

このガイドは「既存履歴のメッセージ規則が弱い場合のフォールバック」として使う。

## Format

`<type>(<scope>): <summary>`

例:

- `feat(ui): redesign viewer header`
- `fix(worker): guard race on init`
- `refactor(engine): extract quality metric helpers`
- `docs(skill): add commit splitting checklist`

## Type Selection

- `feat`: ユーザーに見える機能追加/変更
- `fix`: バグ修正
- `refactor`: 振る舞いを変えない内部改善
- `perf`: 性能改善
- `test`: テスト追加/更新
- `docs`: ドキュメント変更
- `chore`: 雑務・設定・依存更新
- `build`: ビルドシステム/依存管理
- `ci`: CI/CD 設定

## Writing Rules

- summary は命令形で簡潔に書く。
- 何をしたかを明確にし、なぜは本文に書く。
- 1コミットで複数 type を混ぜない。
- 既存履歴に明確なスタイルがある場合は、そのスタイルを優先する。
