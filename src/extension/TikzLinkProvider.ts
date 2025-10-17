import * as vscode from "vscode";
import * as path from "path";

export default class TikzLinkProvider implements vscode.DocumentLinkProvider {
  /**
   * Provide document links for \tikzfig{X} and \ctikzfig{X} patterns in LaTeX files.
   * Creates links to './figures/X.tikz' relative to the main file (obtained from LaTeX Workshop extension) or current file.
   */
  provideDocumentLinks(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DocumentLink[]> {
    const links: vscode.DocumentLink[] = [];
    const text = document.getText();

    // Try to get the root file from LaTeX Workshop (if the extension is not installed or does not return a root file, fall back to current file's directory)
    let baseDir = path.dirname(document.uri.fsPath);
    const lwExtension = vscode.extensions.getExtension("james-yu.latex-workshop");
    if (lwExtension?.isActive) {
      const lwApi = lwExtension.exports;
      const rootFile = lwApi?.manager?.rootFile;
      if (typeof rootFile === "string" && rootFile.length) {
        baseDir = path.dirname(rootFile);
      }
    }

    // Look for figures folder relative to the base directory
    const figuresDir = path.join(baseDir, "figures");

    // Regular expression to match \tikzfig{filename} or \ctikzfig{filename}
    const regex = /\\c?tikzfig\{([^}]+)\}|"tikzcache\/([^"]+).svg"/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const filename = match[1] || match[2];
      const startPos = document.positionAt(match.index);
      const endPos = document.positionAt(match.index + match[0].length);
      const range = new vscode.Range(startPos, endPos);

      // Create URI for the corresponding tikz file
      const tikzFileName = `${filename}.tikz`;
      const tikzFilePath = path.join(figuresDir, tikzFileName);
      const tikzFileUri = vscode.Uri.file(tikzFilePath);

      // Use a command URI so clicking can prompt to create the file if it doesn't exist.
      const cmdArgs = encodeURIComponent(JSON.stringify([tikzFileUri.fsPath]));
      const cmdUri = vscode.Uri.parse(`command:vstikzit.openOrCreateTikz?${cmdArgs}`);

      const link = new vscode.DocumentLink(range, cmdUri);
      link.tooltip = `Open ${tikzFileName}`;
      links.push(link);
    }

    return links;
  }
}

/**
 * Registers the TikzLinkProvider with VS Code for LaTeX and HTML files
 */
export function registerTikzLinkProvider(context: vscode.ExtensionContext): void {
  const provider = new TikzLinkProvider();
  // Register for TeX and HTML files
  const latexSelector = [
    { language: "latex", scheme: "file" },
    { language: "tex", scheme: "file" },
    { language: "html", scheme: "file" },
    { pattern: "**/*.tex", scheme: "file" },
    { pattern: "**/*.html", scheme: "file" },
  ];

  const disposable = vscode.languages.registerDocumentLinkProvider(latexSelector, provider);
  context.subscriptions.push(disposable);
}
