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

  registerTikzLinkProvider(context);

  // these commands are sent to the webview
  const guiCommands = [
    "vstikzit.gui.cut",
    "vstikzit.gui.copy",
    "vstikzit.gui.paste",
    "vstikzit.gui.delete",
    "vstikzit.gui.moveLeft",
    "vstikzit.gui.moveRight",
    "vstikzit.gui.moveUp",
    "vstikzit.gui.moveDown",
    "vstikzit.gui.nudgeLeft",
    "vstikzit.gui.nudgeRight",
    "vstikzit.gui.nudgeUp",
    "vstikzit.gui.nudgeDown",
    "vstikzit.gui.joinPaths",
    "vstikzit.gui.splitPaths",
    "vstikzit.gui.mergeNodes",
    "vstikzit.gui.reflectNodesHorizontally",
    "vstikzit.gui.reflectNodesVertically",
    "vstikzit.gui.reverseEdges",
    "vstikzit.gui.selectAll",
    "vstikzit.gui.deselectAll",
    "vstikzit.gui.extendSelectionLeft",
    "vstikzit.gui.extendSelectionRight",
    "vstikzit.gui.extendSelectionUp",
    "vstikzit.gui.extendSelectionDown",
    "vstikzit.gui.selectTool",
    "vstikzit.gui.nodeTool",
    "vstikzit.gui.edgeTool",
    "vstikzit.gui.viewTikzSource",
    "vstikzit.gui.toggleStylePanel",
    "vstikzit.gui.zoomIn",
    "vstikzit.gui.zoomOut",
    "vstikzit.gui.centerViewport",
  ];
  for (const command of guiCommands) {
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
