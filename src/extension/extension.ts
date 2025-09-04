import * as vscode from "vscode";
import * as path from "path";

import TikzEditorProvider, { currentUri } from "./TikzEditorProvider";
import { buildCurrentTikzFigure } from "./buildTikz";
import { viewCurrentTikzFigure } from "./viewTikz";

function activate(context: vscode.ExtensionContext): void {
  // Register the custom text editor provider
  const provider = new TikzEditorProvider(context);
  const registration = vscode.window.registerCustomEditorProvider("vstikzit.tikzEditor", provider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
    supportsMultipleEditorsPerDocument: false,
  });

  const buildCommand = vscode.commands.registerCommand(
    "vstikzit.buildCurrentTikzFigure",
    buildCurrentTikzFigure
  );

  const viewCommand = vscode.commands.registerCommand(
    "vstikzit.viewCurrentTikzFigure",
    viewCurrentTikzFigure
  );

  const toggleCommand = vscode.commands.registerCommand(
    "vstikzit.toggleTikzEditor",
    toggleTikzEditor
  );

  context.subscriptions.push(registration, buildCommand, viewCommand, toggleCommand);
}

function toggleTikzEditor(): void {
  if (vscode.window.activeTextEditor) {
    vscode.commands.executeCommand(
      "vscode.openWith",
      vscode.window.activeTextEditor.document.uri,
      "vstikzit.tikzEditor"
    );
  } else {
    const uri = currentUri();
    if (uri) {
      vscode.window.showTextDocument(uri);
    }
  }
}

function deactivate(): void {}

export { activate, deactivate };
