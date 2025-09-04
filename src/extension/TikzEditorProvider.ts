import * as vscode from "vscode";

function currentUri(): vscode.Uri | undefined {
  const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;
  if (!activeTab?.input) {
    return undefined;
  }
  const tabInput = activeTab.input as any;
  if (!tabInput.uri) {
    return undefined;
  }
  return tabInput.uri as vscode.Uri;
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

interface WebviewMessage {
  type: string;
  content?: any;
}

interface WebviewContent {
  styleFile: string;
  styles: string;
  document: string;
}

class TikzEditorProvider implements vscode.CustomTextEditorProvider {
  private static tikzDocuments = new Set<vscode.TextDocument>();
  private context: vscode.ExtensionContext;
  private isUpdatingFromGui: boolean;

  static async currentDocument(): Promise<vscode.TextDocument | undefined> {
    // Find the document associated with the currently active tab
    const uri = currentUri();
    if (!uri) {
      return undefined;
    }

    return Array.from(TikzEditorProvider.tikzDocuments).find(
      doc => doc.uri.toString() === uri.toString()
    );
  }

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.isUpdatingFromGui = false;
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    TikzEditorProvider.tikzDocuments.add(document);

    // Setup webview options
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    const [styleFile, styles] = await this.getTikzStyles();
    const content = {
      styleFile: styleFile,
      styles: styles,
      document: document.getText(),
    };

    // Set up the initial webview content
    webviewPanel.webview.html = await this.getHtmlForWebview(webviewPanel.webview, content);

    // Post document changes (e.g. undo/redo) to the webview. We use the isUpdatingFromGui flag
    // to prevent a circular update.
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e: vscode.TextDocumentChangeEvent) => {
        // console.log('Document changed, isUpdatingFromGui:', this.isUpdatingFromGui);
        if (e.document.uri.toString() === document.uri.toString() && !this.isUpdatingFromGui) {
          webviewPanel.webview.postMessage({
            type: "updateToGui",
            content: document.getText(),
          });
        }
      }
    );

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage((e: WebviewMessage) => {
      console.log(`Received message from webview: ${e.type}`, e);
      switch (e.type) {
        case "updateFromGui":
          this.updateFromGui(document, e.content);
          return;
        case "refreshTikzStyles":
          this.refreshTikzStyles(webviewPanel.webview);
          return;
        case "openCodeEditor": {
          this.openCodeEditor(e.content.line, e.content.column);
          return;
        }
      }
    });

    // Clean up subscriptions when webview is disposed
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      // Remove from tracking set
      TikzEditorProvider.tikzDocuments.delete(document);
    });
  }

  async getHtmlForWebview(webview: vscode.Webview, content: WebviewContent): Promise<string> {
    // Get the local path to main script run in the webview
    const scriptPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview.js");
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    // Use a nonce to only allow specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none';
        style-src 'unsafe-inline' ${webview.cspSource};
        img-src 'unsafe-inline' ${webview.cspSource} data: blob:;
        script-src 'nonce-${nonce}' 'unsafe-eval' ${webview.cspSource};
        font-src ${webview.cspSource};
        worker-src 'self' data: blob:;">
				<title>TikZ Editor</title>
				<style>
					body {
						margin: 0;
						padding: 0;
						height: 100vh;
						overflow: hidden;
						font-family: var(--vscode-font-family);
						background-color: var(--vscode-editor-background);
						color: var(--vscode-editor-foreground);
					}
					#root {
						height: 100vh;
						width: 100vw;
					}
				</style>
			</head>
			<body>
				<div id="root"></div>
				<script id="initial-content" type="application/json">${JSON.stringify(content)}</script>
				<script nonce="${nonce}" src="${scriptUri}" type="module"></script>
			</body>
			</html>`;
  }

  async updateFromGui(document: vscode.TextDocument, content: string): Promise<boolean> {
    // console.log("got update from gui");
    this.isUpdatingFromGui = true;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), content);
    const result = await vscode.workspace.applyEdit(edit);
    this.isUpdatingFromGui = false;
    return result;
  }

  async getTikzStyles(): Promise<[string, string]> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return ["", ""];
      }

      // Get files at the root of the first workspace folder
      const workspaceRoot = workspaceFolders[0].uri;
      const files = await vscode.workspace.fs.readDirectory(workspaceRoot);

      // Find the first .tikzstyles file
      const tikzStyles = files.find(
        f => f[1] === vscode.FileType.File && f[0].endsWith(".tikzstyles")
      );

      if (!tikzStyles) {
        return ["", ""];
      }

      // Read the file content
      const fileUri = vscode.Uri.joinPath(workspaceRoot, tikzStyles[0]);
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      const content = Buffer.from(fileContent).toString("utf8");

      return [tikzStyles[0], content];
    } catch {
      return ["", ""];
    }
  }

  async refreshTikzStyles(webview: vscode.Webview): Promise<void> {
    const [styleFile, styles] = await this.getTikzStyles();
    webview.postMessage({
      type: "tikzStylesContent",
      content: {
        filename: styleFile,
        source: styles,
      },
    });
  }

  async openCodeEditor(line: number, column: number): Promise<void> {
    const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;

    if (!activeTab?.input) {
      console.log("No active tab found");
      return;
    }

    // Type guard to check if input has uri property
    const tabInput = activeTab.input as any;
    if (!tabInput.uri) {
      console.log("Active tab has no URI");
      return;
    }

    const documentUri = tabInput.uri as vscode.Uri;

    const editor = await vscode.window.showTextDocument(documentUri, {
      viewColumn: vscode.ViewColumn.Beside,
    });

    // Force cursor positioning
    if (editor) {
      const position = new vscode.Position(line, column);
      editor.selection = new vscode.Selection(position, position);
      editor.revealRange(
        new vscode.Range(position, position),
        vscode.TextEditorRevealType.InCenter
      );
    }
  }
}

export { currentUri, TikzEditorProvider as default };
