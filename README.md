# Live Scratch

[日本語](README_ja.md)

A tool that lets you edit sb3 files in a text editor and instantly reflects changes in the Scratch editor running in your browser.

## Scratch x Vibe Coding

![Demo](demo.gif)

live-scratch exposes `workspace/project.json` as plain JSON. This means **you can edit Scratch projects directly with AI coding agents.**

Simply give natural-language instructions like "change the cat to a dog" or "add a game over screen" to terminal AI agents such as [Claude Code](https://github.com/anthropics/claude-code), [Codex](https://github.com/openai/codex), or [Gemini CLI](https://github.com/google-gemini/gemini-cli), and watch your Scratch project update in real time.

```
You: "Change the cat to a dog"
  ↓ AI edits workspace/project.json
  ↓ live-scratch detects the change
  ↓ Scratch editor in the browser updates instantly
You: See the result and give the next instruction
```

Instead of dragging blocks by hand, program Scratch through conversation. See the results in real time in your browser.

## Setup

```bash
git clone https://github.com/champierre/live-scratch.git
cd live-scratch
npm install
```

`npm install` automatically performs the following after installing dependencies:

1. Clones [scratch-editor](https://github.com/scratchfoundation/scratch-editor) at a pinned version (`81d16ac24`)
2. Applies patches to expose `window.vm` and fix TypeScript type declarations
3. Runs `npm install` and builds `scratch-gui`

## Usage

```bash
npm start
```

1. A default project (Scratch's initial state) is extracted into `workspace/`
2. Your browser automatically opens the Scratch editor
3. Edit and save `workspace/project.json` or asset files with your text editor
4. Changes are instantly reflected in the Scratch editor in the browser

A circular indicator in the top-right corner shows the connection status (green = connected, red = disconnected).

To start from an existing sb3 file:

```bash
npm start -- myproject.sb3
```

To change the port, use the `--port` option:

```bash
npm start -- --port 8080
```

## Architecture

```
[Text Editor] → edit → [workspace/project.json + assets]
                                ↓ chokidar watch
                        [Node.js Server]
                        (Express + WebSocket + chokidar)
                                ↓ WebSocket (ArrayBuffer)
                        [Browser: Scratch GUI + live-reload.js]
                                ↓ vm.loadProject(arrayBuffer)
                        [Scratch editor updates instantly]
```

## Notes

- If `project.json` has a JSON syntax error, an error is displayed in the terminal and the update is skipped
- `vm.loadProject()` reloads the entire project, so running scripts, runtime variable values, and clones are reset
