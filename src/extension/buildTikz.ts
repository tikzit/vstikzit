import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";
import { TikzEditorProvider } from "./editors";
import { stat } from "fs";

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

async function cleanBuildDir(workspaceRoot: vscode.Uri): Promise<void> {
  const files = await vscode.workspace.fs.readDirectory(
    vscode.Uri.joinPath(workspaceRoot, "tikzcache")
  );
  for (const f of files) {
    if (f[0].endsWith(".sty") || f[0].endsWith(".tikzstyles") || f[0].endsWith(".tikzdefs")) {
      await vscode.workspace.fs.delete(vscode.Uri.joinPath(workspaceRoot, "tikzcache", f[0]), {
        useTrash: false,
      });
    }
  }
}

async function cleanAuxFiles(fileName: string, workspaceRoot: vscode.Uri): Promise<void> {
  const baseName = path.basename(fileName, ".tikz");

  await Promise.all(
    [".tmp.tex", ".tmp.aux", ".tmp.log", ".tmp.out", ".tmp.pdf"].map(ext =>
      vscode.workspace.fs.delete(
        vscode.Uri.joinPath(vscode.Uri.joinPath(workspaceRoot, "tikzcache"), baseName + ext)
      )
    )
  );
}

async function buildTikz(
  workspaceRoot: vscode.Uri,
  fileName: string,
  source: string | undefined,
  tikzIncludes: string
): Promise<number> {
  // console.log(`trying to build ${fileName} in ${workspaceRoot.fsPath}`);
  const tikzCacheFolder = vscode.Uri.joinPath(workspaceRoot, "tikzcache");
  // if source is null, load it from the file
  if (!source) {
    try {
      source = await vscode.workspace.fs
        .readFile(vscode.Uri.joinPath(workspaceRoot, "figures", fileName))
        .then(buffer => buffer.toString());
    } catch (error) {
      console.error(`Error reading ${fileName}:`, error);
      throw error;
    }
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
      // console.log(`pdflatex process exited with code ${code}`);
      if (code === 0) {
        // copy the contents of FILE.tmp.pdf into FILE.pdf
        const pdfContent = await vscode.workspace.fs.readFile(
          vscode.Uri.joinPath(tikzCacheFolder, baseName + ".tmp.pdf")
        );
        await vscode.workspace.fs.writeFile(
          vscode.Uri.joinPath(tikzCacheFolder, baseName + ".pdf"),
          pdfContent
        );

        await cleanBuildDir(workspaceRoot);

        resolve(code);
      } else {
        reject(code);
      }
    });
  });
}

async function buildCurrentTikzFigure(): Promise<void> {
  const document = TikzEditorProvider.currentDocument();
  // console.log("Building current TikZ figure...", document?.uri.fsPath);
  const workspaceRoot = document?.uri
    ? vscode.workspace.getWorkspaceFolder(document?.uri)?.uri
    : undefined;
  if (!document || !workspaceRoot) {
    return;
  }

  try {
    const tikzIncludes = await prepareBuildDir(workspaceRoot);
    // create a status bar item with a spinning arrow to show progress
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    statusBarItem.text = "$(sync~spin) Building TikZ figure";
    statusBarItem.show();
    buildTikz(workspaceRoot, document.uri.fsPath, document.getText(), tikzIncludes).then(
      async (_: number) => {
        await cleanAuxFiles(document.uri.fsPath, workspaceRoot);
        statusBarItem.dispose();
      },
      (errorCode: number) => {
        vscode.window.showErrorMessage(`pdflatex exited with code ${errorCode}`);
        const baseName = path.basename(document.uri.fsPath, ".tikz");
        const logFile = baseName !== undefined ? baseName + ".tmp.log" : "tikzfigure.tmp.log";
        vscode.window.showTextDocument(vscode.Uri.joinPath(workspaceRoot, "tikzcache", logFile));
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Unexpected error: ${errorMessage}`);
  }
}

async function getTikzFiguresToRebuild(workspaceRoot: vscode.Uri): Promise<string[]> {
  const figuresFolder = vscode.Uri.joinPath(workspaceRoot, "figures");
  const tikzCacheFolder = vscode.Uri.joinPath(workspaceRoot, "tikzcache");

  // Get all files in the figures folder
  let allFiles: [string, vscode.FileType][] = [];
  try {
    allFiles = await vscode.workspace.fs.readDirectory(figuresFolder);
  } catch {
    // figures folder doesn't exist, so leave allFiles empty
  }

  // Filter to get only .tikz files that need to be rebuilt
  const files: string[] = [];
  for (const [fileName, fileType] of allFiles) {
    if (fileType === vscode.FileType.File && fileName.endsWith(".tikz")) {
      const baseName = path.basename(fileName, ".tikz");
      const tikzFile = vscode.Uri.joinPath(figuresFolder, fileName);
      const pdfFile = vscode.Uri.joinPath(tikzCacheFolder, baseName + ".pdf");

      try {
        // Check if PDF exists and get its modification time
        const [tikzStat, pdfStat] = await Promise.all([
          vscode.workspace.fs.stat(tikzFile),
          vscode.workspace.fs.stat(pdfFile),
        ]);

        // If tikz file is newer than PDF, rebuild
        if (tikzStat.mtime > pdfStat.mtime) {
          files.push(fileName);
        }
      } catch {
        // PDF doesn't exist, so we need to rebuild
        files.push(fileName);
      }
    }
  }

  return files;
}

async function rebuildTikzFigures(): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }

  for (const workspaceRoot of workspaceFolders.map(f => f.uri)) {
    const figuresToRebuild = await getTikzFiguresToRebuild(workspaceRoot);
    if (figuresToRebuild.length > 0) {
      const tikzIncludes = await prepareBuildDir(workspaceRoot);
      let figuresBuilt = 0;
      const errorFiles: string[] = [];
      const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      statusBarItem.text = `$(sync~spin) Rebuilding TikZ figures: ${figuresBuilt}/${figuresToRebuild.length}`;
      statusBarItem.show();
      await Promise.all(
        figuresToRebuild.map(file =>
          buildTikz(workspaceRoot, file, undefined, tikzIncludes).then(
            async () => {
              figuresBuilt += 1;
              await cleanAuxFiles(file, workspaceRoot);
              statusBarItem.text = `$(sync~spin) Rebuilding TikZ figures: ${figuresBuilt}/${figuresToRebuild.length}`;
            },
            () => {
              errorFiles.push(path.basename(file, ".tikz"));
            }
          )
        )
      );

      statusBarItem.dispose();

      if (errorFiles.length > 0) {
        let errorMessage = `Failed to build TikZ figures: ${errorFiles.slice(0, 3).join(", ")}`;
        if (errorFiles.length > 3) {
          errorMessage += `, and ${errorFiles.length - 3} more...`;
        }
        vscode.window.showErrorMessage(errorMessage);
      }
      await cleanBuildDir(workspaceRoot);
    }
  }
}

let tikzFigureWatcher: vscode.FileSystemWatcher | undefined = undefined;

async function syncTikzFigures(): Promise<void> {
  await rebuildTikzFigures();

  // listen for changes in any .tikz file in the figures folder and call rebuildTikzFigures when needed
  stopSyncTikzFigures();
  tikzFigureWatcher = vscode.workspace.createFileSystemWatcher("**/figures/*.tikz");
  tikzFigureWatcher.onDidChange(() => {
    // console.log("Detected change in .tikz file, rebuilding figures...");
    rebuildTikzFigures();
  });
}

async function stopSyncTikzFigures(): Promise<void> {
  if (tikzFigureWatcher !== undefined) {
    tikzFigureWatcher.dispose();
    tikzFigureWatcher = undefined;
  }
}

export { buildCurrentTikzFigure, syncTikzFigures, stopSyncTikzFigures };
