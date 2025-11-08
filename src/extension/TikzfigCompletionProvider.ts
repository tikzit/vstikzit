import * as vscode from "vscode";
import * as path from "path";

// Add the completion provider class
export default class TikzfigCompletionProvider implements vscode.CompletionItemProvider {
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[]> {
    const lineText = document.lineAt(position).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Find the start of the current tikzfig command
    const tikzfigMatch = textBeforeCursor.match(/\\c?tikzfig\{([^}]*)$/);
    if (!tikzfigMatch) {
      return [];
    }

    const partialPath = tikzfigMatch[1];
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);

    if (!workspaceFolder) {
      return [];
    }

    const figuresDir = vscode.Uri.joinPath(workspaceFolder.uri, "figures");

    try {
      const files = await vscode.workspace.fs.readDirectory(figuresDir);
      const completionItems: vscode.CompletionItem[] = [];

      for (const [fileName, fileType] of files) {
        if (fileType === vscode.FileType.File && fileName.endsWith(".tikz")) {
          const baseName = path.basename(fileName, ".tikz");

          if (baseName.toLowerCase().includes(partialPath.toLowerCase())) {
            const item = new vscode.CompletionItem(baseName, vscode.CompletionItemKind.File);
            item.detail = "TikZ Figure";
            item.documentation = `Figure: ${fileName}`;
            item.insertText = baseName;

            // Set the range to replace the partial text after the opening brace
            const startPos = new vscode.Position(
              position.line,
              textBeforeCursor.lastIndexOf("{") + 1
            );
            item.range = new vscode.Range(startPos, position);

            completionItems.push(item);
          }
        }
      }

      return completionItems;
    } catch (error) {
      // figures directory doesn't exist or other error
      return [];
    }
  }
}

export function registerTikzfigCompletionProvider(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { scheme: "file", language: "latex" },
      new TikzfigCompletionProvider(),
      "{" // Trigger completion when user types '{'
    )
  );

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { scheme: "file", language: "tex" },
      new TikzfigCompletionProvider(),
      "{"
    )
  );
}
