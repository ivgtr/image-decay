# image-decay 次作業者向け実装タスク（更新版）

更新日: 2026-02-11

## 前提

- 正式要件は `docs/image-decay_requirements_unified.md`。
- 本ブランチはMVP中核に加え、主要品質メトリクス（PSNR/SSIM）まで完了済み。

## 実装済み（完了）

1. JPEG再エンコード劣化ループ
- `Canvas -> toBlob('image/jpeg', q) -> decode -> redraw` をTickごとに実行。
- 失敗時リトライ（最大3回）を実装。
- `speed` と `batch` を併用したスケジューリングを実装。

2. 比較表示
- オリジナル画像と劣化画像のスプリットビューをCanvasで描画。
- スライダーで比較境界を変更可能。

3. メトリクス（主要）
- 世代、品質、経過時間、FPSを実測更新。
- PSNR / SSIM を計測・表示。
- 高負荷回避のため、間引き更新（5世代ごと）と縮小計測（長辺256px）を適用。

4. 設定UIとバリデーション
- 各パラメータの上限/下限チェックを実装。
- 不正値入力時のエラー表示を統一。
- localStorage復元時のスキーマ検証を実装。

5. パフォーマンス対策（一部）
- Blob URL解放を実装。
- 高解像度入力時の自動リサイズ（長辺4096px）を実装。

6. Worker + OffscreenCanvas（PoC）
- 対応環境ではWorkerでJPEG再エンコードを実行。
- Worker初期化失敗・実行時エラー時はメインスレッド実装へ自動フォールバック。
- `transferToImageBitmap` 後のフレーム復元を実装し、黒画面化を修正。
- Worker受信処理を直列化し、`process`/`init` 競合を回避。

## 未完了（次対応者の優先タスク）

1. Worker + OffscreenCanvasの実機検証と調整
- 高倍率（x8以上）・高解像度でUI応答性が改善しているかを計測。
- Safari/Firefox含む環境差を確認し、必要なら閾値や起動条件を調整。
- `transferToImageBitmap` 復元処理の負荷影響（FPS低下）を確認。

2. 長時間耐久・メモリ観測の定量化
- 10分連続実行時のメモリ推移とFPS推移を計測・記録。
- 設定パターン（低/中/高負荷）ごとの結果を `docs/` に残す。

3. クロスブラウザ実機検証
- Chrome / Edge / Safari / Firefoxで主要導線を確認。
- 既知差分（`createImageBitmap`、canvasデコード差、SSIM計測負荷差）を整理。

4. テスト基盤導入（推奨）
- Vitest + React Testing Libraryを導入。
- まずは以下を対象に最小セットを作成:
  - `computeQuality` と `sanitizeSessionSettings`
  - 再生制御（Play/Pause/Reset）の状態遷移
  - 入力バリデーションのエラー表示
  - 品質メトリクス計算（PSNR/SSIM）の回帰防止

5. SSIM精度・コストの追調整（任意）
- 必要に応じて計測解像度や更新間隔を再調整。
- 実測FPS低下が目立つ条件を文書化し、既定値案を提示。

## 受け入れ確認（次対応者で再実施）

1. Playで劣化進行が開始し、Pause/Resetが正しく動作する
2. x1 -> x8変更時にUIがフリーズしない
3. 100世代以上連続動作してクラッシュしない
4. 10分実行時にメモリ増加が過大にならない
5. 主要ブラウザ（Chrome/Edge/Safari/Firefox）で致命的不具合がない
6. PSNR/SSIM表示が欠落せず、極端な値（NaN/∞）時もUIが破綻しない

## 推奨着手順

1. 耐久計測・メモリ計測をドキュメント化
2. クロスブラウザ最終調整（Workerモード含む）
3. 最小自動テスト導入
4. SSIM精度・コストの追調整（必要時）
