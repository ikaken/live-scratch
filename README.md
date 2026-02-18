# Live Scratch

[日本語](README_ja.md)

A desktop app (Windows) for bi-directional live sync between project files and the Scratch editor. Edit sb3 project files in a text editor and see changes reflected instantly — or make changes in the Scratch editor and have them written back automatically.

*Note: This project is a fork and modification of the original version released for macOS, adapted for use in Windows environments. It was implemented using "vibe coding," so please use it at your own risk.*

## Scratch x Vibe Coding

[![Watch the demo on YouTube](https://img.youtube.com/vi/uoXJ0N3IdK0/maxresdefault.jpg)](https://www.youtube.com/watch?v=uoXJ0N3IdK0)

▶ Click the image above to watch the demo on YouTube

live-scratch exposes `project.json` as plain JSON in `~/Documents/Live Scratch/`. This means **you can edit Scratch projects directly with AI coding agents.**

Simply give natural-language instructions like "change the cat to a dog" or "add a game over screen" to AI agents such as [Claude Code](https://github.com/anthropics/claude-code), [Codex](https://github.com/openai/codex), or [Gemini CLI](https://github.com/google-gemini/gemini-cli), and watch your Scratch project update in real time.

```
You: "Change the cat to a dog"
  ↓ AI edits ~/Documents/Live Scratch/project.json
  ↓ live-scratch detects the change
  ↓ Scratch editor updates instantly
You: See the result and give the next instruction
```

Instead of dragging blocks by hand, program Scratch through conversation. See the results in real time.

## Supported Environments

- Windows 10/11
- (Original macOS version is available in previous commits)

## How to Use

1. Start the app with `npm run tauri:dev`
2. A default project (Scratch's initial state) will be created in `~/Documents/Live Scratch/`
3. Edit `project.json` or asset files with a text editor or AI agent
4. Changes are instantly reflected in the Scratch editor
5. Changes in the Scratch editor (adding blocks, changing sprites, adding costumes/sounds, etc.) are automatically saved to `~/Documents/Live Scratch/`

### Menu

- **File > Open SB3...** (`Ctrl+O`) — Load an existing `.sb3` file
- **File > Export SB3...** (`Ctrl+S`) — Save the current project as `.sb3`
- **File > Show Workspace in Explorer** (`Ctrl+Shift+O`) — Open `~/Documents/Live Scratch/` in File Explorer

## Setup (build from source)

Prerequisites: [Node.js](https://nodejs.org/) and [Rust](https://www.rust-lang.org/tools/install) (with Visual C++ Build Tools).

```bash
git clone https://github.com/champierre/live-scratch.git
cd live-scratch
npm install
```

`npm install` automatically performs the following via `setup.js`:

1. Clones [scratch-editor](https://github.com/scratchfoundation/scratch-editor) at a pinned version (`81d16ac24`)
2. Applies patches to expose `window.vm` and fix TypeScript type declarations
3. Fixes scripts for Windows compatibility
4. Runs `npm install` and builds `scratch-gui`

Run in development mode:

```bash
npm run tauri:dev
```

## Architecture

```
[Text Editor / AI Agent]
    ↕ edit files in ~/Documents/Live Scratch/
[Rust Backend (Tauri v2)]
    workspace.rs  — SB3 build/extract
    watcher.rs    — File watching (notify crate)
    commands.rs   — Tauri IPC commands
    lib.rs        — App init, menu
    ↕ Tauri IPC (window.__TAURI__)
[Scratch GUI + live-reload.js (WebView)]
    ↕ vm.loadProject / vm.saveProjectSb3
[Scratch Editor]
```

- **Workspace → Editor**: The file watcher detects changes, builds an SB3, and sends it to the frontend via Tauri events
- **Editor → Workspace**: Listens for `PROJECT_CHANGED` events, debounces (1s), sends SB3 back to the Rust backend, which extracts it to the workspace
- **Loop prevention**: Both frontend and backend use ignore flags with timeouts to prevent infinite sync loops

## Notes

- If `project.json` has a JSON syntax error, the update is skipped and an error is logged
- `vm.loadProject()` reloads the entire project, so running scripts, runtime variable values, and clones are reset
