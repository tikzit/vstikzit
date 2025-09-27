import * as vscode from "vscode";
import { getNonce } from "../lib/util";

class StylePanelViewProvider implements vscode.WebviewViewProvider {
  private context: vscode.ExtensionContext;
  constructor(context: vscode.ExtensionContext) {
    this.context = context;
  }
  async resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    _token: vscode.CancellationToken
  ): Promise<void> {
    webviewView.webview.options = {
      enableScripts: true,
    };
    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "tikzit_vscode.js")
    );
    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "dist", "tikzit_vscode.css")
    );
    const nonce = getNonce();
    // Generate the HTML content for the webview
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
        <script nonce="${nonce}" type="module">
        import { TikzitExtensionHost } from "${scriptUri}";
        window.addEventListener('load', () => {
          const host = new TikzitExtensionHost();
          const container = document.getElementById("root");
          host.renderStylePanel(container);
        });
        </script>
			</body>
			</html>`;
  }
}

export default StylePanelViewProvider;
