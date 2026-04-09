const editor = getEditor();

// ---------------------------------------------------------------------------
// State - reuse terminal across runs
// ---------------------------------------------------------------------------

// Persist terminal ID across calls (module state may reset per invocation)
if (typeof globalThis._codeRunnerTerminalId === "undefined") {
  globalThis._codeRunnerTerminalId = null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function detectShell(filePath) {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "ps1": return ["pwsh", "-NoProfile", "-File"];
    case "py":  return ["python3"];
    case "js":  return ["node"];
    case "ts":  return ["npx", "ts-node"];
    case "sh":  return ["bash"];
    case "rb":  return ["ruby"];
    default:    return ["pwsh", "-NoProfile", "-File"];
  }
}

async function getOrCreateTerminal() {
  if (globalThis._codeRunnerTerminalId !== null) {
    return globalThis._codeRunnerTerminalId;
  }
  const term = await editor.createTerminal({
    direction: "horizontal",
    ratio: 0.35,
    focus: true,
  });
  globalThis._codeRunnerTerminalId = term.terminalId;
  return globalThis._codeRunnerTerminalId;
}

async function runInTerminal(shellCmd, filePath) {
  const cmdStr = [...shellCmd, `"${filePath}"`].join(" ");
  editor.debug(`Code Runner: ${cmdStr}`);
  try {
    const tid = await getOrCreateTerminal();
    await editor.sendTerminalInput(tid, cmdStr + "\n");
    editor.setStatus(`Code Runner: running with ${shellCmd[0]}`);
  } catch (err) {
    globalThis._codeRunnerTerminalId = null; // terminal was closed, reset
    editor.setStatus(`Code Runner: error - ${err}`);
    editor.debug(`Code Runner error: ${err}`);
  }
}

// ---------------------------------------------------------------------------
// Run File
// ---------------------------------------------------------------------------

async function codeRunnerRunFile() {
  const bufferId = editor.getActiveBufferId();
  const filePath = editor.getBufferPath(bufferId);
  if (!filePath) {
    editor.setStatus("Code Runner: save the file first");
    return;
  }
  await runInTerminal(detectShell(filePath), filePath);
}
globalThis.code_runner_run_file = codeRunnerRunFile;

// ---------------------------------------------------------------------------
// Run Selection
// ---------------------------------------------------------------------------

async function codeRunnerRunSelection() {
  const bufferId = editor.getActiveBufferId();
  const filePath = editor.getBufferPath(bufferId);
  if (!filePath) {
    editor.setStatus("Code Runner: save the file first");
    return;
  }

  const cursor = editor.getPrimaryCursor();
  if (!cursor || !cursor.selection || cursor.selection.start === cursor.selection.end) {
    editor.setStatus("Code Runner: no text selected");
    return;
  }

  const selected = await editor.getBufferText(bufferId, cursor.selection.start, cursor.selection.end);
  if (!selected.trim()) {
    editor.setStatus("Code Runner: selection is empty");
    return;
  }

  const ext = filePath.split(".").pop() ?? "ps1";
  const tempPath = `/tmp/fresh-runner-${Date.now()}.${ext}`;
  await editor.writeFile(tempPath, selected);

  await runInTerminal(detectShell(filePath), tempPath);
}
globalThis.code_runner_run_selection = codeRunnerRunSelection;

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

editor.registerCommand(
  "code_runner_run_file",
  "Code Runner: Run File",
  "code_runner_run_file",
  null
);

editor.registerCommand(
  "code_runner_run_selection",
  "Code Runner: Run Selection",
  "code_runner_run_selection",
  null
);

editor.debug("Code Runner plugin loaded");
