
# Fresh Code Runner

A plugin for [Fresh](https://getfresh.dev) that lets you execute code directly from the editor — just like PowerShell ISE.

## Features
-  Run selected text or entire file
-  Supports **PowerShell**, Python, Node.js, Bash (easily extensible)
-  Output shown in a panel or terminal
-  Configurable via Fresh Settings UI
-  Fast and lightweight

## Installation

### One-click (recommended)
1. Open Fresh
2. Press `Ctrl+P` → type `pkg: Install from URL`
3. Paste: `https://github.com/ramaddk/code-runner.git`

### Manual
```bash
mkdir -p ~/.config/fresh/plugins/packages/code-runner
git clone https://github.com/ramaddk/code-runner.git ~/.config/fresh/plugins/packages/code-runner
