import * as vscode from "vscode";

import TikzEditorProvider, { currentUri } from "./TikzEditorProvider";
import TikzLinkProvider from "./TikzLinkProvider";
import { buildCurrentTikzFigure, stopSyncTikzFigures, syncTikzFigures } from "./buildTikz";
import { viewCurrentTikzFigure } from "./viewTikz";

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

  // register the tikz link provider for LaTeX files
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      [
        { language: "tex", scheme: "file" },
        { pattern: "**/*.tex", scheme: "file" },
        { pattern: "**/*.latex", scheme: "file" },
      ],
      new TikzLinkProvider()
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.buildCurrentTikzFigure", buildCurrentTikzFigure)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.viewCurrentTikzFigure", viewCurrentTikzFigure)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.syncTikzFigures", syncTikzFigures)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("vstikzit.openTikzEditor", openTikzEditor)
  );
}

function openTikzEditor(): void {
  if (vscode.window.activeTextEditor) {
    const uri = vscode.window.activeTextEditor.document.uri;
    if (uri.fsPath.endsWith(".tikz")) {
      if (vscode.window.activeTextEditor.document.isDirty === false) {
        vscode.commands.executeCommand("workbench.action.closeActiveEditor");
      }

      vscode.commands.executeCommand(
        "vscode.openWith",
        uri,
        "vstikzit.tikzEditor"
      );
    } else {
      vscode.commands.executeCommand("editor.action.openLink");
    }
  }
}

function deactivate(): void {
  stopSyncTikzFigures();
}

export { activate, deactivate };
