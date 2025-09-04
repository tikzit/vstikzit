import * as vscode from "vscode";

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
