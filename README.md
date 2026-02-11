# image-decay

JPEG再圧縮による画質劣化を、時間経過で観察するWebアプリケーションです。  
MVPの中核（再エンコードループ、比較表示、主要メトリクス表示、設定バリデーション）まで実装済みです。

## 技術スタック

- React 18
- TypeScript
- Vite
- Tailwind CSS

## セットアップ

```bash
npm install
npm run dev
```

## 現在の状態

- JPEG再エンコード劣化ループ: 実装済み（`toBlob('image/jpeg', q)` + リトライ）
- 比較表示: Canvasスプリットビュー + 境界スライダーを実装済み
- メトリクス: generation / quality / elapsed / FPS / PSNR / SSIMを更新
- 設定: UI入力バリデーション + localStorage復元時のスキーマ検証を実装
- パフォーマンス: Blob URL解放・高解像度自動縮小（長辺4096）を実装
- 未対応: Worker + OffscreenCanvas、クロスブラウザ実機検証、長時間耐久の体系テスト、最小自動テスト導入
