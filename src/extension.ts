import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  // Register the custom text editor provider
  const provider = new TikZEditorProvider(context);
  const registration = vscode.window.registerCustomEditorProvider("vstikzit.tikzEditor", provider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
    supportsMultipleEditorsPerDocument: false,
  });

  context.subscriptions.push(registration);
}

class TikZEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
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

    // // Update webview when document changes
    // const updateWebview = () => {
    //   webviewPanel.webview.postMessage({
    //     type: "update",
    //     content: document.getText(),
    //   });
    // };

    // // Listen for document changes
    // const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
    //   if (e.document.uri.toString() === document.uri.toString()) {
    //     updateWebview();
    //   }
    // });

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage(e => {
      switch (e.type) {
        case "updateTextDocument":
          this.updateTextDocument(document, e.content);
          return;
        case "refreshTikzStyles":
          this.refreshTikzStyles(webviewPanel.webview);
          return;
      }
    });

    // Clean up subscriptions when webview is disposed
    // webviewPanel.onDidDispose(() => {
    //   changeDocumentSubscription.dispose();
    // });
  }

  private async getHtmlForWebview(webview: vscode.Webview, content: any): Promise<string> {
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
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' ${
          webview.cspSource
        }; script-src 'nonce-${nonce}' 'unsafe-eval' ${webview.cspSource}; font-src ${
      webview.cspSource
    }; worker-src 'self' data: blob:;">
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
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  private updateTextDocument(document: vscode.TextDocument, content: string) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), content);
    return vscode.workspace.applyEdit(edit);
  }

  private async getTikzStyles(): Promise<[string, string]> {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return ["", ""];
      }

      // Get files at the root of the first workspace folder
      const workspaceRoot = workspaceFolders[0].uri;
      const files = await vscode.workspace.fs.readDirectory(workspaceRoot);

      // Find the first .tikzstyles file
      const tikzStylesFile = files.find(
        ([name, type]) => type === vscode.FileType.File && name.endsWith(".tikzstyles")
      );

      if (!tikzStylesFile) {
        return ["", ""];
      }

      // Read the file content
      const fileUri = vscode.Uri.joinPath(workspaceRoot, tikzStylesFile[0]);
      const fileContent = await vscode.workspace.fs.readFile(fileUri);
      const content = Buffer.from(fileContent).toString("utf8");

      return [tikzStylesFile[0], content];
    } catch {
      return ["", ""];
    }
  }

  private async refreshTikzStyles(webview: vscode.Webview) {
    const [styleFile, styles] = await this.getTikzStyles();
    webview.postMessage({
      type: "tikzStylesContent",
      content: styles,
      filename: styleFile,
    });
  }
}

function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export function deactivate() {}
