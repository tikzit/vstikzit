import * as vscode from "vscode";
import * as path from "path";
import { TikzEditorProvider } from "./editors";

async function viewCurrentTikzFigure(): Promise<void> {
  const document = TikzEditorProvider.currentDocument();
  const workspaceRoot = document?.uri
    ? vscode.workspace.getWorkspaceFolder(document?.uri)?.uri
    : undefined;
  if (!document || !workspaceRoot) {
    return;
  }

  const baseName = path.basename(document.uri.fsPath, ".tikz");
  const pdfFile = baseName !== undefined ? baseName + ".pdf" : "tikzfigure.pdf";
  const pdfPath = vscode.Uri.joinPath(workspaceRoot, "cache", pdfFile);

  // if the PDF file at pdfPath exists, open it
  try {
    await vscode.workspace.fs.stat(pdfPath);
    await vscode.commands.executeCommand("vscode.open", pdfPath, vscode.ViewColumn.Beside);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to open PDF file: ${errorMessage}`);
  }
}

export { viewCurrentTikzFigure };
