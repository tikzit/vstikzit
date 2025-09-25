import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";
import { TikzEditorProvider } from "./editors";
import { stat } from "fs";

async function prepareBuildDir(workspaceRoot: vscode.Uri): Promise<string> {
  let tikzIncludes = "";

  // create tikz cache folder in workspaceRoot, if it doesn't exist
  await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceRoot, "cache"));

  const cp = (f: string): Thenable<void> => {
    return vscode.workspace.fs.copy(
      vscode.Uri.joinPath(workspaceRoot, f),
      vscode.Uri.joinPath(workspaceRoot, "cache", f),
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
    vscode.Uri.joinPath(workspaceRoot, "cache")
  );
  for (const f of files) {
    if (f[0].endsWith(".sty") || f[0].endsWith(".tikzstyles") || f[0].endsWith(".tikzdefs")) {
      await vscode.workspace.fs.delete(vscode.Uri.joinPath(workspaceRoot, "cache", f[0]), {
        useTrash: false,
      });
    }
  }
}

async function cleanAuxFiles(fileName: string, workspaceRoot: vscode.Uri): Promise<void> {
  const baseName = path.basename(fileName, ".tikz");

  for (const ext of [".tmp.tex", ".tmp.aux", ".tmp.log", ".tmp.out", ".tmp.pdf", ".tmp.svg"]) {
    try {
      await vscode.workspace.fs.delete(
        vscode.Uri.joinPath(vscode.Uri.joinPath(workspaceRoot, "cache"), baseName + ext)
      );
    } catch (error) {
      // file probably doesn't exist, so just ignore the error
    }
  }
}

async function sh(path: string, command: string, args: string[]): Promise<number> {
  const cmd = spawn(command, args, { cwd: path, shell: false });

  return new Promise((resolve, reject) => {
    cmd.on("close", async code => {
      // console.log(`${command} exited with code ${code}`);
      if (code === 0) {
        resolve(code);
      } else {
        reject(code);
      }
    });
  });
}

async function buildTikz(
  workspaceRoot: vscode.Uri,
  fileName: string,
  source: string | undefined,
  tikzIncludes: string,
  svg: boolean = false
): Promise<number> {
  // console.log(`trying to build ${fileName} in ${workspaceRoot.fsPath}, svg = ${svg}`);
  const tikzCacheFolder = vscode.Uri.joinPath(workspaceRoot, "cache");
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
  const baseName = path.basename(fileName, ".tikz") ?? "tikzfigure";
  const texFile = baseName + ".tmp.tex";

  await vscode.workspace.fs.writeFile(
    vscode.Uri.joinPath(tikzCacheFolder, texFile),
    Buffer.from(tex)
  );

  try {
    await sh(tikzCacheFolder.fsPath, "pdflatex", [
      "-interaction=nonstopmode",
      "-halt-on-error",
      texFile,
    ]);

    let outExt = "pdf";
    if (svg) {
      outExt = "svg";
      await sh(tikzCacheFolder.fsPath, "dvisvgm", [
        "--pdf",
        "--no-fonts",
        "--scale=2,2",
        baseName + ".tmp.pdf",
        "-o",
        baseName + ".tmp.svg",
      ]);
    }

    // copy the contents of FILE.tmp.(pdf|svg) into FILE.(pdf|svg)
    // console.log(`Copying ${baseName}.tmp.${outExt} to ${baseName}.${outExt}`);
    const outContent = await vscode.workspace.fs.readFile(
      vscode.Uri.joinPath(tikzCacheFolder, `${baseName}.tmp.${outExt}`)
    );
    await vscode.workspace.fs.writeFile(
      vscode.Uri.joinPath(tikzCacheFolder, `${baseName}.${outExt}`),
      outContent
    );

    return 0;
  } catch (err) {
    if (typeof err === "number") {
      return err;
    } else {
      throw err;
    }
  }
}

async function buildCurrentTikzFigure(svg: boolean = false): Promise<void> {
  // console.log(`Building current TikZ figure, svg = ${svg}`);
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
    buildTikz(workspaceRoot, document.uri.fsPath, document.getText(), tikzIncludes, svg).then(
      async (_: number) => {
        await cleanAuxFiles(document.uri.fsPath, workspaceRoot);
        await cleanBuildDir(workspaceRoot);
        statusBarItem.dispose();
      },
      error => {
        vscode.window.showErrorMessage(`build exited with error ${error}`);
        const baseName = path.basename(document.uri.fsPath, ".tikz") ?? "tikzfigure";
        const logFile = baseName + ".tmp.log";
        vscode.window.showTextDocument(vscode.Uri.joinPath(workspaceRoot, "cache", logFile));
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Unexpected error: ${errorMessage}`);
  }
}

async function getTikzFiguresToRebuild(
  workspaceRoot: vscode.Uri,
  svg: boolean = false
): Promise<string[]> {
  const figuresFolder = vscode.Uri.joinPath(workspaceRoot, "figures");
  const tikzCacheFolder = vscode.Uri.joinPath(workspaceRoot, "cache");
  const outExt = svg ? ".svg" : ".pdf";

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
      const outFile = vscode.Uri.joinPath(tikzCacheFolder, baseName + outExt);

      try {
        // Check if PDF exists and get its modification time
        const [tikzStat, outStat] = await Promise.all([
          vscode.workspace.fs.stat(tikzFile),
          vscode.workspace.fs.stat(outFile),
        ]);

        // If tikz file is newer than PDF, rebuild
        if (tikzStat.mtime > outStat.mtime) {
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

// used to prevent multiple simultaneous rebuilds and exit early if set to false while a rebuild is ongoing
let rebuildingTikzFigures = false;

async function rebuildTikzFigures(svg: boolean = false): Promise<void> {
  if (rebuildingTikzFigures) {
    return;
  }
  rebuildingTikzFigures = true;
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    return;
  }

  for (const folder of workspaceFolders) {
    const workspaceRoot = folder.uri;
    const figuresToRebuild = await getTikzFiguresToRebuild(workspaceRoot, svg);
    if (figuresToRebuild.length > 0) {
      const tikzIncludes = await prepareBuildDir(workspaceRoot);
      let figuresBuilt = 0;
      const errorFiles: string[] = [];
      const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
      statusBarItem.text = `$(sync~spin) Rebuilding TikZ figures: 0/${figuresToRebuild.length}`;
      statusBarItem.show();

      // Split figuresToRebuild into chunks of at most 10
      const chunkSize = 10;
      const chunks = [];
      for (let i = 0; i < figuresToRebuild.length; i += chunkSize) {
        chunks.push(figuresToRebuild.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        if (!rebuildingTikzFigures) {
          break;
        }
        await Promise.all(
          chunk.map(file =>
            buildTikz(workspaceRoot, file, undefined, tikzIncludes, svg).then(
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
      }

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
  rebuildingTikzFigures = false;
}

let tikzFigureWatcher: vscode.FileSystemWatcher | undefined = undefined;
let tikzFigureSVGWatcher: vscode.FileSystemWatcher | undefined = undefined;

async function syncTikzFigures(): Promise<void> {
  stopSyncTikzFigures();
  await rebuildTikzFigures();

  // listen for changes in any .tikz file in the figures folder and call rebuildTikzFigures when needed
  tikzFigureWatcher = vscode.workspace.createFileSystemWatcher("**/figures/*.tikz");
  tikzFigureWatcher.onDidChange(() => {
    rebuildTikzFigures();
  });
}

async function syncTikzFiguresSVG(): Promise<void> {
  // listen for changes in any .tikz file in the figures folder and call rebuildTikzFigures when needed
  stopSyncTikzFigures();
  await rebuildTikzFigures(true);

  tikzFigureSVGWatcher = vscode.workspace.createFileSystemWatcher("**/figures/*.tikz");
  tikzFigureSVGWatcher.onDidChange(() => {
    rebuildTikzFigures(true);
  });
}

async function stopSyncTikzFigures(): Promise<void> {
  if (tikzFigureWatcher !== undefined) {
    tikzFigureWatcher.dispose();
    tikzFigureWatcher = undefined;
  }
  if (tikzFigureSVGWatcher !== undefined) {
    tikzFigureSVGWatcher.dispose();
    tikzFigureSVGWatcher = undefined;
  }
  rebuildingTikzFigures = false;
}

export { buildCurrentTikzFigure, syncTikzFigures, syncTikzFiguresSVG, stopSyncTikzFigures };
