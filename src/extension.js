import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";
// const vscode = require("vscode");
// const path = require("path");
// const spawn = require("child_process").spawn;

// Set to track all open TikZ documents
const tikzDocuments = new Set();

function activate(context) {
  // Register the custom text editor provider
  const provider = new TikZEditorProvider(context);
  const registration = vscode.window.registerCustomEditorProvider("vstikzit.tikzEditor", provider, {
    webviewOptions: {
      retainContextWhenHidden: true,
    },
    supportsMultipleEditorsPerDocument: false,
  });

  const buildCommand = vscode.commands.registerCommand("vstikzit.buildTikzFigure", buildTikzFigure);
  const toggleEditorCommand = vscode.commands.registerCommand(
    "vstikzit.toggleEditor",
    toggleEditor
  );

  context.subscriptions.push(registration, buildCommand, toggleEditorCommand);
}

class TikZEditorProvider {
  constructor(context) {
    this.context = context;
    this.isUpdatingFromGui = false;
  }

  async resolveCustomTextEditor(document, webviewPanel, _token) {
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

    // // Update webview when document changes
    // const updateWebview = () => {
    //   webviewPanel.webview.postMessage({
    //     type: "update",
    //     content: document.getText(),
    //   });
    // };

    // Post document changes (e.g. undo/redo) to the webview. We use the isUpdatingFromGui flag
    // to prevent a circular update.
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      // console.log('Document changed, isUpdatingFromGui:', this.isUpdatingFromGui);
      if (e.document.uri.toString() === document.uri.toString() && !this.isUpdatingFromGui) {
        webviewPanel.webview.postMessage({
          type: "updateToGui",
          content: document.getText(),
        });
      }
    });

    // Handle messages from the webview
    webviewPanel.webview.onDidReceiveMessage(e => {
      switch (e.type) {
        case "updateFromGui":
          this.updateFromGui(document, e.content);
          return;
        case "refreshTikzStyles":
          this.refreshTikzStyles(webviewPanel.webview);
          return;
      }
    });

    // Clean up subscriptions when webview is disposed
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
      // Remove from tracking set
      tikzDocuments.delete(document);
    });
  }

  async getHtmlForWebview(webview, content) {
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
        img-src 'unsafe-inline' ${webview.cspSource};
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
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  async updateFromGui(document, content) {
    // console.log("got update from gui");
    this.isUpdatingFromGui = true;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), content);
    const result = await vscode.workspace.applyEdit(edit);
    this.isUpdatingFromGui = false;
    return result;
  }

  async getTikzStyles() {
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

  async refreshTikzStyles(webview) {
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

async function buildTikzFigure() {
  // Find the document associated with the currently active tab
  const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;

  if (!activeTab || !activeTab.input || !activeTab.input.uri) {
    vscode.window.showErrorMessage("No active TikZ editor found");
    return;
  }

  // Find the document that matches the active tab's URI
  let document = null;
  for (const doc of tikzDocuments) {
    if (doc.uri.toString() === activeTab.input.uri.toString()) {
      document = doc;
      break;
    }
  }

  if (!document) {
    vscode.window.showErrorMessage("No active TikZ document found");
    return;
  }

  try {
    vscode.window.showInformationMessage("Building TikZ figure...");
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showInformationMessage("No active workspace");
      return;
    }

    const workspaceRoot = workspaceFolders[0].uri;
    // create tikzcache folder in workspaceRoot, if it doesn't exist
    const tikzCacheFolder = vscode.Uri.joinPath(workspaceRoot, "tikzcache");
    try {
      await vscode.workspace.fs.createDirectory(tikzCacheFolder);
    } catch {}

    // locate a .tikzstyles file and .tikzdefs file in the workspace root
    const files = await vscode.workspace.fs.readDirectory(workspaceRoot);

    // Try to locate .tikzstyles and .tikzdefs files
    const tikzStyles = files.find(
      ([name, type]) => type === vscode.FileType.File && name.endsWith(".tikzstyles")
    );
    const tikzDefs = files.find(
      ([name, type]) => type === vscode.FileType.File && name.endsWith(".tikzdefs")
    );

    let tex = "\\documentclass{article}\n";

    // check tikzit.sty is in the workspace root
    const tikzitSty = files.find(
      ([name, type]) => type === vscode.FileType.File && name === "tikzit.sty"
    );

    if (tikzitSty) {
      await vscode.workspace.fs.copy(
        vscode.Uri.joinPath(workspaceRoot, "tikzit.sty"),
        vscode.Uri.joinPath(tikzCacheFolder, "tikzit.sty"),
        { overwrite: true }
      );
      tex += "\\usepackage{tikzit}\n\\tikzstyle{every picture}=[tikzfig]\n";
    } else {
      vscode.window.showInformationMessage("Warning: tikzit.sty not found in workspace");
    }

    tex += "\\usepackage[graphics,active,tightpage]{preview}\n\\PreviewEnvironment{tikzpicture}\n";

    if (tikzStyles) {
      await vscode.workspace.fs.copy(
        vscode.Uri.joinPath(workspaceRoot, tikzStyles[0]),
        vscode.Uri.joinPath(tikzCacheFolder, tikzStyles[0]),
        { overwrite: true }
      );
      tex += `\\input{${tikzStyles[0]}}\n`;
    }

    if (tikzDefs) {
      await vscode.workspace.fs.copy(
        vscode.Uri.joinPath(workspaceRoot, tikzDefs[0]),
        vscode.Uri.joinPath(tikzCacheFolder, tikzDefs[0]),
        { overwrite: true }
      );
      tex += `\\input{${tikzDefs[0]}}\n`;
    }

    tex += "\\begin{document}\n\n";
    tex += document.getText();
    tex += "\n\\end{document}\n";

    // if this document has a file name, get the base name
    const baseName = path.basename(document.fileName, ".tikz");
    const fileName = baseName !== undefined ? baseName + ".tex" : "tikzfigure.tex";

    await vscode.workspace.fs.writeFile(
      vscode.Uri.joinPath(tikzCacheFolder, fileName),
      Buffer.from(tex)
    );

    // run pdflatex from tikzCacheFolder on fileName
    const pdflatex = spawn("pdflatex", ["-interaction=nonstopmode", "-halt-on-error", fileName], {
      cwd: tikzCacheFolder.fsPath,
      shell: true,
    });

    pdflatex.on("close", code => {
      if (code === 0) {
        for (const ext of [".tex", ".aux", ".log", ".out"]) {
          vscode.workspace.fs.delete(vscode.Uri.joinPath(tikzCacheFolder, baseName + ext));
        }
        vscode.window.showInformationMessage("TikZ figure built successfully!");
      } else {
        vscode.window.showErrorMessage(
          `Failed to build TikZ figure: pdflatex exited with code ${code}`
        );
      }
    });
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to build TikZ figure: ${error.message}`);
  }
}

async function toggleEditor() {
  const activeTab = vscode.window.tabGroups.activeTabGroup.activeTab;

  if (!activeTab || !activeTab.input || !activeTab.input.uri) {
    vscode.window.showErrorMessage("No active editor found");
    return;
  }

  const documentUri = activeTab.input.uri;

  if (vscode.window.activeTextEditor === undefined) {
    // Switch to default text editor
    await vscode.commands.executeCommand(
      "vscode.openWith",
      documentUri,
      "vscode.editor.defaultEditor"
    );
  } else {
    // Switch to TikZ editor
    await vscode.commands.executeCommand("vscode.openWith", documentUri, "vstikzit.tikzEditor");
  }
}

function deactivate() {}

// module.exports = {
//   activate,
//   deactivate,
// };

export { activate, deactivate };
