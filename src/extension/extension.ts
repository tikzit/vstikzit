import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";

// Interfaces for message types
interface WebviewMessage {
  type: string;
  content?: any;
}

interface UpdateFromGuiMessage extends WebviewMessage {
  type: "updateFromGui";
  content: string;
}

interface RefreshTikzStylesMessage extends WebviewMessage {
  type: "refreshTikzStyles";
}

interface OpenCodeEditorMessage extends WebviewMessage {
  type: "openCodeEditor";
  content: {
    line: number;
    column: number;
  };
}

interface UpdateToGuiMessage extends WebviewMessage {
  type: "updateToGui";
  content: string;
}

interface TikzStylesContentMessage extends WebviewMessage {
  type: "tikzStylesContent";
  content: string;
  filename: string;
}

interface WebviewContent {
  styleFile: string;
  styles: string;
  document: string;
}

// Set to track all open TikZ documents
const tikzDocuments = new Set<vscode.TextDocument>();

function activate(context: vscode.ExtensionContext): void {
  // Register the custom text editor provider
  const provider = new TikZEditorProvider(context);
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

  context.subscriptions.push(registration, buildCommand, viewCommand);
}

class TikZEditorProvider implements vscode.CustomTextEditorProvider {
  private context: vscode.ExtensionContext;
  private isUpdatingFromGui: boolean;

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.isUpdatingFromGui = false;
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    _token: vscode.CancellationToken
  ): Promise<void> {
    // Track this document
    tikzDocuments.add(document);

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
          } as UpdateToGuiMessage);
        }
      }
    );

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage((e: WebviewMessage) => {
      console.log(`Received message from webview: ${e.type}`, e);
      switch (e.type) {
        case "updateFromGui":
          this.updateFromGui(document, (e as UpdateFromGuiMessage).content);
          return;
        case "refreshTikzStyles":
          this.refreshTikzStyles(webviewPanel.webview);
          return;
        case "openCodeEditor": {
          const openEditorMsg = e as OpenCodeEditorMessage;
          console.log("openCodeEditor message received with content:", openEditorMsg.content);
          this.openCodeEditor(openEditorMsg.content.line, openEditorMsg.content.column);
          return;
        }
      }
    });

    // Clean up subscriptions when webview is disposed
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      // Remove from tracking set
      tikzDocuments.delete(document);
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
      content: styles,
      filename: styleFile,
    } as TikzStylesContentMessage);
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

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

async function prepareBuildDir(workspaceRoot: vscode.Uri): Promise<string> {
  let tikzIncludes = "";

  // create tikzcache folder in workspaceRoot, if it doesn't exist
  await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceRoot, "tikzcache"));

  const cp = (f: string): Thenable<void> => {
    return vscode.workspace.fs.copy(
      vscode.Uri.joinPath(workspaceRoot, f),
      vscode.Uri.joinPath(workspaceRoot, "tikzcache", f),
      { overwrite: true }
    );
  };

  // Try to locate tikzit.sty, .tikzstyles, and .tikzdefs files
  const files = await vscode.workspace.fs.readDirectory(workspaceRoot);
  const tikzit = files.find(f => f[1] === vscode.FileType.File && f[0] === "tikzit.sty");
  const tikzStyles = files.find(f => f[1] === vscode.FileType.File && f[0].endsWith(".tikzstyles"));
  const tikzDefs = files.find(f => f[1] === vscode.FileType.File && f[0].endsWith(".tikzdefs"));

  if (tikzit) {
    await cp("tikzit.sty");
    tikzIncludes += "\\usepackage{tikzit}\n\\tikzstyle{every picture}=[tikzfig]\n";
  } else {
    vscode.window.showInformationMessage("Warning: tikzit.sty not found in workspace");
  }

  tikzIncludes +=
    "\\usepackage[graphics,active,tightpage]{preview}\n\\PreviewEnvironment{tikzpicture}\n";

  if (tikzStyles) {
    await cp(tikzStyles[0]);
    tikzIncludes += `\\input{${tikzStyles[0]}}\n`;
  }

  if (tikzDefs) {
    await cp(tikzDefs[0]);
    tikzIncludes += `\\input{${tikzDefs[0]}}\n`;
  }

  return tikzIncludes;
}

async function buildTikz(
  workspaceRoot: vscode.Uri,
  fileName: string,
  source: string | null,
  tikzIncludes: string
): Promise<number> {
  const tikzCacheFolder = vscode.Uri.joinPath(workspaceRoot, "tikzcache");
  // if source is null, we should not proceed (this case is not handled properly)
  if (!source) {
    throw new Error("Source content is required");
  }

  let tex = "\\documentclass{article}\n";
  tex += tikzIncludes;
  tex += "\\begin{document}\n\n";
  tex += source;
  tex += "\n\\end{document}\n";

  // if this document has a file name, get the base name
  const baseName = path.basename(fileName, ".tikz");
  const texFile = baseName !== undefined ? baseName + ".tmp.tex" : "tikzfigure.tmp.tex";

  await vscode.workspace.fs.writeFile(
    vscode.Uri.joinPath(tikzCacheFolder, texFile),
    Buffer.from(tex)
  );

  // run pdflatex from tikzCacheFolder on texFile
  const pdflatex = spawn("pdflatex", ["-interaction=nonstopmode", "-halt-on-error", texFile], {
    cwd: tikzCacheFolder.fsPath,
    shell: true,
  });

  return new Promise((resolve, reject) => {
    pdflatex.on("close", async code => {
      console.log(`pdflatex process exited with code ${code}`);
      if (code === 0) {
        // copy the contents of FILE.tmp.pdf into FILE.pdf
        const pdfContent = await vscode.workspace.fs.readFile(
          vscode.Uri.joinPath(tikzCacheFolder, baseName + ".tmp.pdf")
        );
        await vscode.workspace.fs.writeFile(
          vscode.Uri.joinPath(tikzCacheFolder, baseName + ".pdf"),
          pdfContent
        );

        for (const ext of [".tmp.tex", ".tmp.aux", ".tmp.log", ".tmp.out", ".tmp.pdf"]) {
          await vscode.workspace.fs.delete(vscode.Uri.joinPath(tikzCacheFolder, baseName + ext));
        }
        resolve(code);
      } else {
        reject(code);
      }
    });
  });
}

async function getDocAndWorkspace(): Promise<[vscode.TextDocument | null, vscode.Uri | null]> {
  // Find the document associated with the currently active tab
  const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;

  if (!activeTab?.input) {
    vscode.window.showErrorMessage("No active TikZ editor found");
    return [null, null];
  }

  // Type guard for tab input with uri
  const tabInput = activeTab.input as any;
  if (!tabInput.uri) {
    vscode.window.showErrorMessage("No active TikZ editor found");
    return [null, null];
  }

  const document = Array.from(tikzDocuments).find(
    (doc: vscode.TextDocument) => doc.uri.toString() === tabInput.uri.toString()
  );

  if (!document) {
    vscode.window.showErrorMessage("No active TikZ document found");
    return [null, null];
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
  if (!workspaceFolder) {
    vscode.window.showErrorMessage("No workspace folder found");
    return [null, null];
  }
  // const workspaceFolders = vscode.workspace.workspaceFolders;
  // if (!workspaceFolders || workspaceFolders.length === 0) {
  //   vscode.window.showInformationMessage("No active workspace");
  //   return;
  // }

  // const workspaceRoot = workspaceFolders[0].uri;

  return [document, workspaceFolder.uri];
}

async function buildCurrentTikzFigure(): Promise<void> {
  const [document, workspaceRoot] = await getDocAndWorkspace();
  if (!document || !workspaceRoot) {
    return;
  }

  try {
    const tikzIncludes = await prepareBuildDir(workspaceRoot);
    buildTikz(workspaceRoot, document.fileName, document.getText(), tikzIncludes).then(
      (_: number) => vscode.window.showInformationMessage(`Success`),
      (errorCode: number) => {
        vscode.window.showErrorMessage(`pdflatex exited with code ${errorCode}`);
        const baseName = path.basename(document.fileName, ".tikz");
        const logFile = baseName !== undefined ? baseName + ".tmp.log" : "tikzfigure.tmp.log";
        vscode.window.showTextDocument(vscode.Uri.joinPath(workspaceRoot, "tikzcache", logFile));
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Unexpected error: ${errorMessage}`);
  }
}

async function viewCurrentTikzFigure(): Promise<void> {
  const [document, workspaceRoot] = await getDocAndWorkspace();
  if (!document || !workspaceRoot) {
    return;
  }

  const baseName = path.basename(document.fileName, ".tikz");
  const pdfFile = baseName !== undefined ? baseName + ".pdf" : "tikzfigure.pdf";
  const pdfPath = vscode.Uri.joinPath(workspaceRoot, "tikzcache", pdfFile);

  // if the PDF file at pdfPath exists, open it
  try {
    await vscode.workspace.fs.stat(pdfPath);
    await vscode.commands.executeCommand("vscode.open", pdfPath, vscode.ViewColumn.Beside);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to open PDF file: ${errorMessage}`);
  }
}

function deactivate(): void {}

// module.exports = {
//   activate,
//   deactivate,
// };

export { activate, deactivate };
