
/// <reference path="../types/fresh.d.ts" />

// ─────────────────────────────────────────────────────────────
// Code Runner Plugin for Fresh
// Run selected code or entire file (like PowerShell ISE)
// Supports PowerShell, Python, Node.js, Bash, and more
// ─────────────────────────────────────────────────────────────

editor.registerConfig("code-runner", {
  enabled: { type: "boolean", default: true, description: "Enable the code runner" },
  defaultShell: { type: "string", default: "pwsh", description: "Default shell/command (pwsh, python3, node, bash)" },
  showOutputInPanel: { type: "boolean", default: true, description: "Show output in a panel (instead of terminal)" },
  timeoutMs: { type: "number", default: 30000, description: "Maximum execution time in milliseconds" },
  clearPanelBeforeRun: { type: "boolean", default: true, description: "Clear previous output before running" }
});

const runCode = async () => {
  const config = editor.getConfig("code-runner");
  if (!config.enabled) {
    editor.setStatus("Code Runner is disabled in settings");
    return;
  }

  const buffer = editor.getCurrentBuffer();
  if (!buffer) {
    editor.setStatus("No active buffer");
    return;
  }

  let code = buffer.getText();
  const selection = buffer.getSelection();
  if (selection && selection.start !== selection.end) {
    code = buffer.getTextInRange(selection);
  }

  const fileExt = buffer.getFileExtension()?.toLowerCase();
  let cmd: string[] = [];

  const shell = config.defaultShell || "pwsh";

  switch (shell) {
    case "python3":
    case "python":
      cmd = ["python3", "-c", code];
      break;
    case "node":
      cmd = ["node", "-e", code];
      break;
    case "bash":
      cmd = ["bash", "-c", code];
      break;
    case "pwsh":
    default:
      cmd = ["pwsh", "-NoProfile", "-Command", code];
      break;
  }

  editor.setStatus(`Running with ${shell}...`);

  try {
    const result = await editor.spawnProcess(cmd[0], cmd.slice(1), {
      cwd: buffer.getDir() || editor.getConfigDir(),
      timeoutMs: config.timeoutMs || 30000
    });

    const output = result.stdout + (result.stderr ? "\n--- STDERR ---\n" + result.stderr : "");

    if (config.showOutputInPanel) {
      if (config.clearPanelBeforeRun) {
        editor.closePanel("Code Output");
      }
      editor.createPanel("Code Output", output || "(No output)");
    } else {
      editor.openTerminal();
      editor.insertAtCursor(output);
    }

    if (result.exit_code === 0) {
      editor.setStatus(`✓ Finished successfully`);
    } else {
      editor.setStatus(`✗ Finished with code ${result.exit_code}`);
    }
  } catch (err) {
    editor.setStatus(`Error: ${err}`);
  }
};

// Register command and keybinding
editor.registerCommand("code-runner.run", "Run Code (like PowerShell ISE)", runCode, "normal");
editor.bindKey("ctrl+shift+r", "code-runner.run");     // Main hotkey
editor.bindKey("ctrl+enter", "code-runner.run");       // Alternative (like ISE)

editor.setStatus("Code Runner plugin loaded successfully ✓");
