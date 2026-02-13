# タスク

- [x] プロジェクト構造とドキュメントの分析 <!-- id: 0 -->
- [x] macOS依存関係とWindows対応の実現可能性の確認 <!-- id: 1 -->
- [x] Windows専用化の実装プラン作成 <!-- id: 2 -->
- [ ] Windows専用化の実装 <!-- id: 3 -->
    - [ ] `setup.sh` を削除し `setup.js` を作成
    - [ ] `cleanup-build.sh` を削除し `cleanup-build.js` を作成
    - [ ] `package.json` の更新
    - [ ] `tauri.conf.json` の更新（macOS設定削除、Windows設定追加）
    - [ ] `lib.rs` の修正（macOSコード削除、Windows用に置換）
    - [ ] `commands.rs` の修正（macOSコード削除、Windows用に置換）
- [ ] 動作確認 <!-- id: 4 -->
