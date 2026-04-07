/// <reference path="./lib/fresh.d.ts" />

const editor = getEditor();

// Register configuration
editor.registerConfig("code-runner", {
  enabled: { type: "boolean", default: true, description: "Enable code runner" },
  defaultShell: { type: "string", default: "pwsh", description: "Shell: pwsh, python3, node, bash" },
  showOutputInPanel: { type: "boolean", default: true, description: "Show output in panel" },
  timeoutMs: { type: "number", default: 30000, description: "Timeout ms" },
  clearPanelBeforeRun: { type: "boolean", default: true, description: "Clear output" }
});

const runCode = async () => {
  const config = editor.getConfig("code-runner");
  if (config.enabled === false) {
    editor.setStatus("Code Runner disabled");
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

  const shell = config.defaultShell || "pwsh";
  let cmd: string[] = [];

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
    default:
      cmd = ["pwsh", "-NoProfile", "-Command", code];
  }

  editor.setStatus(`Running ${shell}...`);

  try {
    const result = await editor.spawnProcess(cmd[0], cmd.slice(1), {
      timeoutMs: config.timeoutMs || 30000
    });

    if (result) {
      const output = (result.stdout || "") + (result.stderr ? "\n--- STDERR ---\n" + result.stderr : "");
      if (config.showOutputInPanel !== false) {
        editor.createPanel("Code Output", output || "(No output)");
      }
      editor.setStatus(result.exit_code === 0 ? "✓ Done" : `✗ Exit ${result.exit_code}`);
    }
  } catch (err) {
    editor.setStatus(`Error: ${err}`);
  }
};

editor.registerCommand("code-runner.run", "Run Code", runCode);
editor.bindKey("ctrl+shift+r", "code-runner.run");
editor.bindKey("ctrl+enter", "code-runner.run");
