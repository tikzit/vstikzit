import * as vscode from "vscode";
import * as path from "path";

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

class BaseEditorProvider {
  private static openDocuments = new Set<vscode.TextDocument>();
  private static openPanels = new Set<vscode.WebviewPanel>();
  private context: vscode.ExtensionContext;
  private isUpdatingFromGui: boolean = false;
  protected entryPoint: string = "unknown";
  protected diagnosticCollection: vscode.DiagnosticCollection;

  static documentWithUri(uri: vscode.Uri): vscode.TextDocument | undefined {
    return Array.from(BaseEditorProvider.openDocuments).find(
      doc => doc.uri.toString() === uri.toString()
    );
  }

  static currentDocument(): vscode.TextDocument | undefined {
    // Find the document associated with the currently active tab
    const uri = currentUri();
    if (!uri) {
      return undefined;
    }

    return BaseEditorProvider.documentWithUri(uri);
  }

  static currentPanel(): vscode.WebviewPanel | undefined {
    return Array.from(BaseEditorProvider.openPanels).find(panel => panel.active && panel.visible);
  }

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection("tikz");
  }

  protected guiConfig(): { [key: string]: any } {
    const config = vscode.workspace.getConfiguration("vstikzit");
    return {
      enableAnimations: config.get<boolean>("enableAnimations", true),
      axisColor: config.get<string>("axisColor", "#8839ef"),
      majorGridColor: config.get<string>("majorGridColor", "#cccccc"),
      minorGridColor: config.get<string>("minorGridColor", "#eeeeee"),
    };
  }

  protected async initialContent(document: vscode.TextDocument): Promise<string> {
    return JSON.stringify({ config: this.guiConfig(), document: document.getText() });
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    BaseEditorProvider.openDocuments.add(document);
    BaseEditorProvider.openPanels.add(webviewPanel);

    // Setup webview options
    webviewPanel.webview.options = {
      enableScripts: true,
    };

    // Set up the initial webview content
    const contentJson = await this.initialContent(document);
    webviewPanel.webview.html = await this.getHtmlForWebview(webviewPanel.webview, contentJson);

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
      // console.log(`Received message from webview: ${e.type}`, e);
      switch (e.type) {
        case "updateFromGui":
          this.updateFromGui(document, e.content);
          return;
        case "refreshTikzStyles":
          this.refreshTikzStyles(webviewPanel.webview);
          return;
        case "openTikzStyles":
          this.openTikzStyles();
          return;
        case "openCodeEditor": {
          this.openCodeEditor(e.content.line, e.content.column);
          return;
        }
        case "setErrors": {
          this.setErrors(e.content);
          return;
        }
        case "showErrors": {
          vscode.commands.executeCommand("workbench.panel.markers.view.focus");
          return;
        }
      }
    });

    // Clean up subscriptions when webview is disposed
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      // Remove from tracking set
      BaseEditorProvider.openDocuments.delete(document);
      BaseEditorProvider.openPanels.delete(webviewPanel);
    });
  }

  async getHtmlForWebview(webview: vscode.Webview, contentJson: string): Promise<string> {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "tikzit_vscode.js")
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "tikzit_vscode.css")
    );
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
				<link rel="stylesheet" href="${cssUri}">
				<style>
					body {
						margin: 0;
						padding: 0;
						height: 100vh;
						overflow: hidden;
						font-family: var(--tikzit-font-family);
						background-color: var(--tikzit-editor-background);
						color: var(--tikzit-editor-foreground);
					}
					#root {
						height: 100vh;
						width: 100vw;
					}
				</style>
			</head>
			<body>
				<div id="root" style="width: 100%; height: 100%;"></div>
				<script id="initial-content" type="application/json">${contentJson}</script>
        <script nonce="${nonce}" type="module">
        import { TikzitExtensionHost } from "${scriptUri}";
        window.addEventListener('load', () => {
          const host = new TikzitExtensionHost();
          const container = document.getElementById("root");
          const initialContent = JSON.parse(document.getElementById("initial-content").textContent);
          host.${this.entryPoint}(container, initialContent);
        });
        </script>
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

  async setErrors(errors: { line: number; column: number; message: string }[]): Promise<void> {
    // console.log("Setting errors", JSON.stringify(errors));
    const diagnostics: vscode.Diagnostic[] = errors.map(err => {
      const range = new vscode.Range(err.line, err.column, err.line, err.column + 1);
      const diagnostic = new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error);
      const uri = BaseEditorProvider.currentDocument()?.uri;
      diagnostic.source = "TikZiT Parser";

      if (!uri) {
        return diagnostic;
      }

      // Add a code with a command link to open in text editor
      diagnostic.code = {
        value: "show source",
        target: vscode.Uri.parse(
          `command:vstikzit.showError?${encodeURIComponent(
            JSON.stringify([uri.toString(), err.line, err.column])
          )}`
        ),
      };
      return diagnostic;
    });

    const uri = BaseEditorProvider.currentDocument()?.uri;
    if (uri !== undefined) {
      this.diagnosticCollection.set(uri, diagnostics);
    }
  }

  async getTikzStyles(withContent: boolean = true): Promise<[string, string]> {
    try {
      const document = TikzEditorProvider.currentDocument();
      // console.log("Building current TikZ figure...", document?.uri.fsPath);
      const workspaceRoot = document?.uri
        ? vscode.workspace.getWorkspaceFolder(document?.uri)?.uri
        : undefined;

      if (!workspaceRoot) {
        return ["", ""];
      }

      // Find the first .tikzstyles file
      const files = await vscode.workspace.fs.readDirectory(workspaceRoot);
      const tikzStyles = files.find(
        f => f[1] === vscode.FileType.File && f[0].endsWith(".tikzstyles")
      );

      if (!tikzStyles) {
        return ["", ""];
      }

      const stylePath = path.join(workspaceRoot.fsPath, tikzStyles[0]);

      if (!withContent) {
        return [stylePath, ""];
      }

      const fileContent = await vscode.workspace.fs.readFile(vscode.Uri.file(stylePath));
      const content = Buffer.from(fileContent).toString("utf8");

      return [stylePath, content];
    } catch {
      return ["", ""];
    }
  }

  async refreshTikzStyles(webview: vscode.Webview): Promise<void> {
    const [styleFile, styles] = await this.getTikzStyles();
    webview.postMessage({
      type: "tikzStylesContent",
      content: {
        filename: path.basename(styleFile),
        source: styles,
      },
    });
  }

  async openTikzStyles(): Promise<void> {
    const [styleFile, _] = await this.getTikzStyles(false);
    vscode.commands.executeCommand("vscode.open", vscode.Uri.file(styleFile));
  }

  async openCodeEditor(line: number, column: number): Promise<void> {
    const documentUri = currentUri();
    if (documentUri === undefined) {
      return;
    }

    const editor = await vscode.window.showTextDocument(documentUri);

    // Set cursor position
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

class TikzEditorProvider extends BaseEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(context: vscode.ExtensionContext) {
    super(context);
    this.entryPoint = "renderTikzEditor";
  }

  protected async initialContent(document: vscode.TextDocument): Promise<string> {
    const [styleFile, styles] = await this.getTikzStyles();
    const content = {
      config: this.guiConfig(),
      styleFile: path.basename(styleFile),
      styles: styles,
      document: document.getText(),
    };
    return JSON.stringify(content);
  }
}

class StyleEditorProvider extends BaseEditorProvider implements vscode.CustomTextEditorProvider {
  constructor(context: vscode.ExtensionContext) {
    super(context);
    this.entryPoint = "renderStyleEditor";
  }
}

export { currentUri, TikzEditorProvider, StyleEditorProvider };
