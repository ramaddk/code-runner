const editor = getEditor();

// ---------------------------------------------------------------------------
// Shell detection by file extension
// ---------------------------------------------------------------------------

function detectShell(filePath: string): string[] {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "ps1":  return ["pwsh", "-NoProfile", "-File"];
    case "py":   return ["python3"];
    case "js":   return ["node"];
    case "ts":   return ["npx", "ts-node"];
    case "sh":   return ["bash"];
    case "rb":   return ["ruby"];
    default:     return ["pwsh", "-NoProfile", "-File"];
  }
}

// ---------------------------------------------------------------------------
// Run command handler
// ---------------------------------------------------------------------------

async function codeRunnerRun(): Promise<void> {
  const bufferId = editor.getActiveBufferId();
  const filePath = editor.getBufferPath(bufferId);

  if (!filePath) {
    editor.setStatus("Code Runner: open and save a file first");
    return;
  }

  const shellCmd = detectShell(filePath);
  const cmd = [...shellCmd, filePath];
  editor.setStatus(`Code Runner: running with ${shellCmd[0]}...`);
  editor.debug(`Code Runner: ${cmd.join(" ")}`);

  try {
    const term = await editor.createTerminal({
      direction: "horizontal",
      ratio: 0.35,
      focus: true,
    });
    const quotedPath = `"${filePath}"`;
    const cmdStr = [...shellCmd, quotedPath].join(" ");
    await editor.sendTerminalInput(term.terminalId, cmdStr + "\n");
  } catch (err) {
    editor.setStatus(`Code Runner: error - ${err}`);
    editor.debug(`Code Runner error: ${err}`);
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
