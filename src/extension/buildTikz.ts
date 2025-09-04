import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";
import TikzEditorProvider from "./TikzEditorProvider";

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

async function buildCurrentTikzFigure(): Promise<void> {
  const document = await TikzEditorProvider.currentDocument();
  const workspaceRoot = document?.uri
    ? vscode.workspace.getWorkspaceFolder(document?.uri)?.uri
    : undefined;
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

export { buildCurrentTikzFigure };
