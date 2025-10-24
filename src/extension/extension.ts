import * as vscode from "vscode";

import { StyleEditorProvider, TikzEditorProvider, currentUri } from "./editors";
import TikzLinkProvider, { registerTikzLinkProvider } from "./TikzLinkProvider";
import {
  buildCurrentTikzFigure,
  stopSyncTikzFigures,
  syncTikzFigures,
  syncTikzFiguresSVG,
} from "./buildTikz";
import { viewCurrentTikzFigure } from "./viewTikz";
import path from "path";

function activate(context: vscode.ExtensionContext): void {
  // register the custom tikz editor
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      "vstikzit.tikzEditor",
      new TikzEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    )
  );

  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(
      "vstikzit.tikzStylesEditor",
      new StyleEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
        supportsMultipleEditorsPerDocument: false,
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.buildCurrentTikzFigure", () =>
      buildCurrentTikzFigure(false)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.buildCurrentTikzFigureSVG", () =>
      buildCurrentTikzFigure(true)
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.viewCurrentTikzFigure", viewCurrentTikzFigure)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.syncTikzFigures", syncTikzFigures)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.syncTikzFiguresSVG", syncTikzFiguresSVG)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.stopSyncingTikzFigures", stopSyncTikzFigures)
  );

  context.subscriptions.push(vscode.commands.registerCommand("vstikzit.showError", showError));
  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.openTikzEditor", openTikzEditor)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.openOrCreateTikz", openOrCreateTikz)
  );

  // // register the tikz link provider for LaTeX files
  // context.subscriptions.push(
  //   vscode.languages.registerDocumentLinkProvider(
  //     [
  //       { language: "tex", scheme: "file" },
  //       { language: "latex", scheme: "file" },
  //       { language: "html", scheme: "file" },
  //       { pattern: "**/*.tex", scheme: "file" },
  //       { pattern: "**/*.html", scheme: "file" },
  //     ],
  //     new TikzLinkProvider()
  //   )
  // );

  registerTikzLinkProvider(context);

  // graph editor commands
  const graphCommands = [
    "vstikzit.viewTikzSource",
    "vstikzit.selectAll",
    "vstikzit.deselectAll",
    "vstikzit.extendSelectionLeft",
    "vstikzit.extendSelectionRight",
    "vstikzit.extendSelectionUp",
    "vstikzit.extendSelectionDown",
    "vstikzit.moveLeft",
    "vstikzit.moveRight",
    "vstikzit.moveUp",
    "vstikzit.moveDown",
    "vstikzit.nudgeLeft",
    "vstikzit.nudgeRight",
    "vstikzit.nudgeUp",
    "vstikzit.nudgeDown",
    "vstikzit.joinPaths",
    "vstikzit.splitPaths",
    "vstikzit.mergeNodes",
  ];
  for (const command of graphCommands) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, () => sendCommand(command))
    );
  }
}

function sendCommand(command: string): void {
  const panel = TikzEditorProvider.currentPanel();
  // console.log("Got command", command);
  // console.log("Panel:", panel);
  if (panel) {
    panel.webview.postMessage({ type: "command", content: command });
  }
}

async function showError(uri: string, line?: number, column?: number): Promise<void> {
  await vscode.window.showTextDocument(vscode.Uri.parse(uri), {
    selection: new vscode.Range(line ?? 0, column ?? 0, line ?? 0, column ?? 0),
  });
}

function openTikzEditor(): void {
  if (vscode.window.activeTextEditor) {
    const uri = vscode.window.activeTextEditor.document.uri;
    if (uri.fsPath.endsWith(".tikz")) {
      if (vscode.window.activeTextEditor.document.isDirty === false) {
        vscode.commands.executeCommand("workbench.action.closeActiveEditor");
      }

      vscode.commands.executeCommand("vscode.openWith", uri, "vstikzit.tikzEditor");
    } else {
      vscode.commands.executeCommand("editor.action.openLink");
    }
  }
}

async function openOrCreateTikz(uriStr: string): Promise<void> {
  const fileUri = vscode.Uri.file(uriStr);
  try {
    // Check existence
    await vscode.workspace.fs.stat(fileUri);
  } catch {
    // Not found -> ask to create
    const fileName = fileUri.path.split("/").pop();
    const choice = await vscode.window.showInformationMessage(
      `${fileName} does not exist. Create it?`,
      "Create",
      "Cancel"
    );
    if (choice === "Create") {
      await vscode.workspace.fs.writeFile(fileUri, new Uint8Array());
    } else {
      return; // User cancelled
    }
  }
  // Open the file with the TikZ Editor
  vscode.commands.executeCommand("vscode.openWith", fileUri, "vstikzit.tikzEditor");
}

function deactivate(): void {
  stopSyncTikzFigures();
}

export { activate, deactivate };
