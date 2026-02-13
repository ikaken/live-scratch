# Windows専用化 実装計画

## 目標

Live Scratch を **Windows専用** アプリとして再構築する。macOS固有の設定・コードは **すべて削除** する。

## 分析結果

| カテゴリ | ファイル | 対応内容 |
|---|---|---|
| ビルドスクリプト | `setup.sh` | 🗑️ 削除 → `setup.js` に置き換え |
| ビルドスクリプト | `cleanup-build.sh` | 🗑️ 削除 → `cleanup-build.js` に置き換え |
| Rust バックエンド | `lib.rs` | ✏️ macOS用`#[cfg]`ブロック削除、Windows用コードに置換 |
| Rust バックエンド | `commands.rs` | ✏️ macOS用`#[cfg]`ブロック削除、Windows用コードに置換 |
| Tauri設定 | `tauri.conf.json` | ✏️ macOS設定削除、Windowsバンドル設定に変更 |
| Rust バックエンド | `workspace.rs`, `watcher.rs` | ✅ 変更不要 |
| フロントエンド | `live-reload.js` | ✅ 変更不要 |
| 依存クレート | `Cargo.toml` | ✅ 変更不要 |

## 提案する変更

### 1. ビルドスクリプト

---

#### [DELETE] [setup.sh](file:///c:/work/live-scratch/setup.sh)
Bashスクリプトを削除。

#### [NEW] [setup.js](file:///c:/work/live-scratch/setup.js)
`setup.sh` の完全な移植版（Node.js）:
- `scratch-editor` のgitクローン
- `gui.jsx` / `types.d.ts` へのパッチ適用（JS文字列置換）
- `npm install` と `npm run build:dev` の実行
- `live-reload.js` のコピーと `index.html` への挿入

#### [DELETE] [cleanup-build.sh](file:///c:/work/live-scratch/src-tauri/cleanup-build.sh)
Bashスクリプトを削除。

#### [NEW] [cleanup-build.js](file:///c:/work/live-scratch/src-tauri/cleanup-build.js)
`cleanup-build.sh` の移植版（Node.js）:
- `.map` ファイルの再帰削除
- 不要エントリポイントの削除

---

#### [MODIFY] [package.json](file:///c:/work/live-scratch/package.json)
```diff
-"prepare": "bash setup.sh",
+"prepare": "node setup.js",
```

### 2. Tauri設定

---

#### [MODIFY] [tauri.conf.json](file:///c:/work/live-scratch/src-tauri/tauri.conf.json)
- `beforeBundleCommand`: `bash cleanup-build.sh` → `node cleanup-build.js`
- `bundle.targets`: `["dmg", "app"]` → `["nsis", "msi"]`（Windows用インストーラー）
- `bundle.macOS` セクション: **削除**
- `bundle.icon`: macOS用 `.icns` を削除、`.ico` のみ残す

### 3. Rustコード

---

#### [MODIFY] [lib.rs](file:///c:/work/live-scratch/src-tauri/src/lib.rs)
- メニュー項目: `"Show Workspace in Finder"` → `"Show Workspace in Explorer"`
- `show_workspace` ハンドラ: `#[cfg(target_os = "macos")]` ブロックを削除し、Windows用 `explorer` コマンドに置換
```rust
let _ = std::process::Command::new("explorer")
    .arg(&*state.0)
    .spawn();
```

#### [MODIFY] [commands.rs](file:///c:/work/live-scratch/src-tauri/src/commands.rs)
- `open_workspace_in_finder`: `#[cfg(target_os = "macos")]` ブロックを削除し、Windows用に置換
```rust
std::process::Command::new("explorer")
    .arg(&*state.0)
    .spawn()
    .map_err(|e| format!("Failed to open Explorer: {}", e))?;
```

## 検証計画

### 自動テスト
1. `node setup.js` がエラーなく完了
2. `scratch-editor` のクローン・パッチ・ビルド成果物を確認

### 手動検証
1. `npm install` → `npm run tauri:dev` でアプリ起動を確認
2. 「Show Workspace in Explorer」でエクスプローラーが開くか確認
3. `project.json` とScratchエディタの双方向同期を確認
