import * as vscode from "vscode";

import TikzEditorProvider, { currentUri } from "./TikzEditorProvider";
import TikzLinkProvider from "./TikzLinkProvider";
import { buildCurrentTikzFigure } from "./buildTikz";
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
    vscode.commands.registerCommand("vstikzit.toggleTikzEditor", toggleTikzEditor)
  );

  // Auto-open TikZ files in the custom editor
  // TODO: this doesn't work well yet

  // const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(document => {
  //   const fileName = document.fileName.replace(/\.git$/, "");
  //   const isTikzFile = path.extname(fileName).toLowerCase() === ".tikz";
  //   console.log(`Opened document: ${fileName}, isTikzFile: ${isTikzFile}`);
  //   if (isTikzFile) {
  //     if (TikzEditorProvider.documentWithUri(vscode.Uri.file(fileName)) === undefined) {
  //       vscode.commands.executeCommand(
  //         "vscode.openWith",
  //         vscode.Uri.file(fileName),
  //         "vstikzit.tikzEditor",
  //         vscode.ViewColumn.One
  //       );
  //     }
  //   }
  // });
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
