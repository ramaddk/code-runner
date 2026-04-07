// Code Runner Plugin for Fresh
// Run selected code or entire file (like PowerShell ISE)
// Supports PowerShell, Python, Node.js, Bash, and more

const activate = (api: any) => {
  const runCode = async () => {
    const config = api.editor.getConfig("code-runner");
    if (!config?.enabled) {
      api.editor.setStatus("Code Runner is disabled in settings");
      return;
    }

    const buffer = api.editor.getCurrentBuffer();
    if (!buffer) {
      api.editor.setStatus("No active buffer");
      return;
    }

    let code = buffer.getText();
    const selection = buffer.getSelection();
    if (selection && selection.start !== selection.end) {
      code = buffer.getTextInRange(selection);
    }

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

    api.editor.setStatus(`Running with ${shell}...`);

    try {
      const result = await api.editor.spawnProcess(cmd[0], cmd.slice(1), {
        cwd: buffer.getDir?.() || api.editor.getConfigDir?.(),
        timeoutMs: config.timeoutMs || 30000
      });

      const output = (result.stdout || "") + (result.stderr ? "\n--- STDERR ---\n" + result.stderr : "");

      if (config.showOutputInPanel) {
        if (config.clearPanelBeforeRun) {
          api.editor.closePanel?.("Code Output");
        }
        api.editor.createPanel?.("Code Output", output || "(No output)");
      } else {
        api.editor.openTerminal?.();
        api.editor.insertAtCursor?.(output);
      }

      if (result.exit_code === 0) {
        api.editor.setStatus(`✓ Finished successfully`);
      } else {
        api.editor.setStatus(`✗ Finished with code ${result.exit_code}`);
      }
    } catch (err) {
      api.editor.setStatus(`Error: ${err}`);
    }
  };

  api.editor.registerConfig("code-runner", {
    enabled: { type: "boolean", default: true, description: "Enable the code runner" },
    defaultShell: { type: "string", default: "pwsh", description: "Default shell/command (pwsh, python3, node, bash)" },
    showOutputInPanel: { type: "boolean", default: true, description: "Show output in a panel" },
    timeoutMs: { type: "number", default: 30000, description: "Maximum execution time in milliseconds" },
    clearPanelBeforeRun: { type: "boolean", default: true, description: "Clear previous output before running" }
  });

  api.editor.registerCommand("code-runner.run", "Run Code", runCode, "normal");
  api.editor.bindKey("ctrl+shift+r", "code-runner.run");
  api.editor.bindKey("ctrl+enter", "code-runner.run");

  api.editor.setStatus("Code Runner plugin loaded ✓");
};

const deactivate = () => {
  // Cleanup if needed
};

export default { activate, deactivate };
