function activate(api) {
  console.log("[code-runner] Activating plugin");
  
  // Register configuration
  api.editor.registerConfig?.("code-runner", {
    enabled: { type: "boolean", default: true, description: "Enable the code runner" },
    defaultShell: { type: "string", default: "pwsh", description: "Default shell (pwsh, python3, node, bash)" },
    showOutputInPanel: { type: "boolean", default: true, description: "Show output in panel" },
    timeoutMs: { type: "number", default: 30000, description: "Timeout in ms" },
    clearPanelBeforeRun: { type: "boolean", default: true, description: "Clear output before run" }
  });

  const runCode = async () => {
    const config = api.editor.getConfig?.("code-runner") || {};
    if (config.enabled === false) {
      api.editor.setStatus?.("Code Runner disabled");
      return;
    }

    const buffer = api.editor.getCurrentBuffer?.();
    if (!buffer) {
      api.editor.setStatus?.("No active buffer");
      return;
    }

    let code = buffer.getText?.() || "";
    const selection = buffer.getSelection?.();
    if (selection && selection.start !== selection.end) {
      code = buffer.getTextInRange?.(selection) || code;
    }

    const shell = config.defaultShell || "pwsh";
    let cmd = [];

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

    api.editor.setStatus?.(`Running ${shell}...`);

    try {
      const result = await api.editor.spawnProcess?.(cmd[0], cmd.slice(1), {
        timeoutMs: config.timeoutMs || 30000
      });

      if (!result) return;

      const output = (result.stdout || "") + (result.stderr ? "\n--- STDERR ---\n" + result.stderr : "");

      if (config.showOutputInPanel !== false) {
        api.editor.createPanel?.("Code Output", output || "(No output)");
      } else {
        api.editor.openTerminal?.();
        api.editor.insertAtCursor?.(output);
      }

      api.editor.setStatus?.(result.exit_code === 0 ? "✓ Done" : `✗ Exit ${result.exit_code}`);
    } catch (err) {
      api.editor.setStatus?.(`Error: ${err}`);
    }
  };

  api.editor.registerCommand?.("code-runner.run", "Run Code", runCode);
  api.editor.bindKey?.("ctrl+shift+r", "code-runner.run");
  api.editor.bindKey?.("ctrl+enter", "code-runner.run");

  console.log("[code-runner] Plugin activated");
}

function deactivate() {
  // Cleanup if needed
}

export default { activate, deactivate };
