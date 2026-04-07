export default {
  name: "code-runner",
  activate(api) {
    // Register config first
    api.registerConfig("code-runner", {
      enabled: { type: "boolean", default: true, description: "Enable code runner" },
      defaultShell: { type: "string", default: "pwsh", description: "Shell: pwsh, python3, node, bash" },
      showOutputInPanel: { type: "boolean", default: true, description: "Show output in panel" },
      timeoutMs: { type: "number", default: 30000, description: "Timeout ms" },
      clearPanelBeforeRun: { type: "boolean", default: true, description: "Clear output" }
    });

    const runCode = async () => {
      const config = api.getConfig("code-runner");
      if (config.enabled === false) return;

      const editor = api.editor;
      const buffer = editor.currentBuffer;
      if (!buffer) return;

      let code = buffer.getText();
      if (buffer.selection && buffer.selection.start !== buffer.selection.end) {
        code = buffer.getTextInRange(buffer.selection);
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

      try {
        const result = await editor.spawnProcess(cmd[0], cmd.slice(1), {
          timeoutMs: config.timeoutMs || 30000
        });

        if (result) {
          const output = (result.stdout || "") + (result.stderr ? "\n--- STDERR ---\n" + result.stderr : "");
          if (config.showOutputInPanel !== false) {
            editor.createPanel("Code Output", output || "(No output)");
          }
        }
      } catch (err) {
        console.error("code-runner error:", err);
      }
    };

    api.registerCommand("code-runner.run", "Run Code", runCode);
    api.bindKey("ctrl+shift+r", "code-runner.run");
    api.bindKey("ctrl+enter", "code-runner.run");
  },
  deactivate() {}
};
