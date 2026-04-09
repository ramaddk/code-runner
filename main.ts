const editor = getEditor();

// ---------------------------------------------------------------------------
// State - reuse terminal across runs
// ---------------------------------------------------------------------------

let activeTerminalId = null;

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
  if (activeTerminalId !== null) {
    return activeTerminalId;
  }
  const term = await editor.createTerminal({
    direction: "horizontal",
    ratio: 0.35,
    focus: true,
  });
  activeTerminalId = term.terminalId;
  return activeTerminalId;
}

async function runInTerminal(shellCmd, filePath) {
  const cmdStr = [...shellCmd, `"${filePath}"`].join(" ");
  editor.debug(`Code Runner: ${cmdStr}`);
  try {
    const tid = await getOrCreateTerminal();
    await editor.sendTerminalInput(tid, cmdStr + "\n");
    editor.setStatus(`Code Runner: running with ${shellCmd[0]}`);
  } catch (err) {
    activeTerminalId = null; // terminal was closed, reset
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
registerHandler("codeRunnerRunFile", codeRunnerRunFile);

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

  const cursor = editor.getCursorPosition();
  if (!cursor.selection || cursor.selection.start === cursor.selection.end) {
    editor.setStatus("Code Runner: no text selected");
    return;
  }

  const content = await editor.readFile(filePath);
  const selected = content.slice(cursor.selection.start, cursor.selection.end);
  if (!selected.trim()) {
    editor.setStatus("Code Runner: selection is empty");
    return;
  }

  const ext = filePath.split(".").pop() ?? "ps1";
  const tempPath = `/tmp/fresh-runner-${Date.now()}.${ext}`;
  await editor.writeFile(tempPath, selected);

  await runInTerminal(detectShell(filePath), tempPath);
}
registerHandler("codeRunnerRunSelection", codeRunnerRunSelection);

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

editor.registerCommand(
  "code_runner_run_file",
  "Code Runner: Run File",
  "codeRunnerRunFile",
  null
);

editor.registerCommand(
  "code_runner_run_selection",
  "Code Runner: Run Selection",
  "codeRunnerRunSelection",
  null
);

editor.debug("Code Runner plugin loaded");
