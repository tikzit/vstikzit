import * as vscode from "vscode";

import { StyleEditorProvider, TikzEditorProvider, currentUri } from "./editors";
import TikzLinkProvider from "./TikzLinkProvider";
import {
  buildCurrentTikzFigure,
  stopSyncTikzFigures,
  syncTikzFigures,
  syncTikzFiguresSVG,
} from "./buildTikz";
import { viewCurrentTikzFigure } from "./viewTikz";
import StylePanelViewProvider from "./StylePanelViewProvider";

function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      "vstikzit.stylePanelView",
      new StylePanelViewProvider(context)
    )
  );

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

  // register the tikz link provider for LaTeX files
  context.subscriptions.push(
    vscode.languages.registerDocumentLinkProvider(
      [
        { language: "tex", scheme: "file" },
        { language: "latex", scheme: "file" },
        { language: "html", scheme: "file" },
        { pattern: "**/*.tex", scheme: "file" },
        { pattern: "**/*.html", scheme: "file" },
      ],
      new TikzLinkProvider()
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

function deactivate(): void {
  stopSyncTikzFigures();
}

export { activate, deactivate };
