# タスク

- [x] プロジェクト構造とドキュメントの分析 <!-- id: 0 -->
- [x] macOS依存関係とWindows対応の実現可能性の確認 <!-- id: 1 -->
- [x] Windows専用化の実装プラン作成 <!-- id: 2 -->
- [x] Windows専用化の実装 <!-- id: 3 -->
    - [x] `setup.sh` を削除し `setup.js` を作成
    - [x] `cleanup-build.sh` を削除し `cleanup-build.js` を作成
    - [x] `package.json` の更新
    - [x] `tauri.conf.json` の更新（macOS設定削除、Windows設定追加）
    - [x] `lib.rs` の修正（macOSコード削除、Windows用に置換）
    - [x] `commands.rs` の修正（macOSコード削除、Windows用に置換）
- [ ] 旧bashスクリプトの削除（setup.sh, cleanup-build.sh） <!-- id: 5 -->
- [x] Rustのインストール <!-- id: 6 -->
- [ ] 動作確認（現在 `npm install` 実行中、完了後に `npm run tauri:dev`） <!-- id: 4 -->
