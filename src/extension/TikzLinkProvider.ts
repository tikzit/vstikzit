import * as vscode from "vscode";
import * as path from "path";

export default class TikzLinkProvider implements vscode.DocumentLinkProvider {
  /**
   * Provide document links for \tikzfig{X} and \ctikzfig{X} patterns in LaTeX files.
   * Creates links to figures/X.tikz files in the workspace.
   */
  provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();

    // Regular expression to match \tikzfig{filename} or \ctikzfig{filename}
    // Captures the filename in group 1
    const regex = /\\c?tikzfig\{([^}]+)\}/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
      const filename = match[1];
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);

      // Create URI for the corresponding tikz file
      const tikzFileName = `${filename}.tikz`;
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

      if (workspaceFolder) {
        const tikzFilePath = path.join(workspaceFolder.uri.fsPath, "figures", tikzFileName);
        const tikzFileUri = vscode.Uri.file(tikzFilePath);

        const link = new vscode.DocumentLink(range, tikzFileUri);
        link.tooltip = `Open ${tikzFileName}`;
        links.push(link);
      }
    }

    return links;
  }
}

/**
 * Registers the TikzLinkProvider with VS Code for LaTeX files
 */
export function registerTikzLinkProvider(context: vscode.ExtensionContext): void {
  const provider = new TikzLinkProvider();

  // Register for various LaTeX file types
  const latexSelector = [
    { language: "latex", scheme: "file" },
    { language: "tex", scheme: "file" },
    { pattern: "**/*.tex", scheme: "file" },
    { pattern: "**/*.latex", scheme: "file" },
  ];

  const disposable = vscode.languages.registerDocumentLinkProvider(latexSelector, provider);
  context.subscriptions.push(disposable);
}
