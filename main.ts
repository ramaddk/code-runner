/// <reference path="./lib/fresh.d.ts" />
const editor = getEditor();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPluginConfig(): Record<string, unknown> {
  const globalConfig = editor.getConfig() as Record<string, unknown>;
  const packages = globalConfig?.packages as Record<string, unknown> | undefined;
  const plugins = packages?.plugins as Record<string, unknown> | undefined;
  const pluginEntry = plugins?.["code-runner"] as Record<string, unknown> | undefined;
  const pluginConfig = pluginEntry?.config as Record<string, unknown> | undefined;
  return pluginConfig ?? {};
}

function buildCommand(filePath: string, shell: string): string[] {
  switch (shell) {
    case "python3":
    case "python":
      return ["python3", filePath];
    case "node":
      return ["node", filePath];
    case "bash":
      return ["bash", filePath];
    default:
      return ["pwsh", "-NoProfile", "-File", filePath];
  }
}

// ---------------------------------------------------------------------------
// Run command handler
// ---------------------------------------------------------------------------

async function codeRunnerRun(): Promise<void> {
  const config = getPluginConfig();

  if (config.enabled === false) {
    editor.setStatus("Code Runner: disabled");
    return;
  }

  const bufferId = editor.getActiveBufferId();
  const filePath = editor.getBufferPath(bufferId);

  if (!filePath) {
    editor.setStatus("Code Runner: save the file first");
    return;
  }

  const shell = (config.defaultShell as string) || "pwsh";
  const cmd = buildCommand(filePath, shell);

  editor.setStatus(`Code Runner: running ${shell}...`);
  editor.debug(`Code Runner: ${cmd.join(" ")}`);

  try {
    const result = await editor.spawnProcess(cmd[0], cmd.slice(1), null);
    const stdout = result.stdout || "";
    const stderr = result.stderr || "";
    const output = stdout + (stderr ? "\n--- STDERR ---\n" + stderr : "") || "(no output)";

    if (config.showOutputInPanel !== false) {
      await editor.createVirtualBufferInSplit({
        name: "*Code Output*",
        mode: "special",
        read_only: true,
        entries: [{ text: output }],
        ratio: 0.35,
        panel_id: "code-runner-output",
      });
    }

    editor.setStatus(
      result.exit_code === 0 ? "Code Runner: done" : `Code Runner: exit ${result.exit_code}`
    );
  } catch (err) {
    editor.setStatus(`Code Runner: error - ${err}`);
  }
}
registerHandler("codeRunnerRun", codeRunnerRun);

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

editor.registerCommand(
  "code-runner.run",
  "Code Runner: Run File",
  "codeRunnerRun",
  null
);

editor.debug("Code Runner plugin loaded");
