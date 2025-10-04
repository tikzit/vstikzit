# TikZiT for VS Code

[TikZiT](https://tikzit.github.io) is a simple GUI editor for graphs and diagrams. Its native file format is a subset of PGF/TikZ, which means TikZiT files can be included directly in papers typeset using LaTeX. It is a stand-alone application that has been around for about 15 years. This is a VS Code extension that provides a very similar UI to TikZiT directly inside of the editor.

This is still experimental, with some features, bugfixes, and documentation still to come. However, the main features of TikZiT have been implemented, along with some new goodies that make use of the VS Code environment. Please try it and tell me what you think! As usual, you can report issues on the [issue tracker](https://github.com/tikzit/vstikzit/issues).

## Installation

TikZiT for VS Code is not yet available on the VS Code marketplace, however it is still easy to install via VSIX file.

Download the latest `.vsix` file from the [releases page](https://github.com/tikzit/vstikzit/releases) by expanding the "Assets" section and clicking on `vstikzit-X.Y.Z.vsix`. Then, in VS Code, open the command palette (Ctrl+Shift+P or Cmd+Shift+P) and select "Extensions: Install from VSIX...". Select the downloaded file and follow the prompts to install the extension.

## Usage

Once the extension is installed, `.tikz` files will automatically open in the TikZiT editor. The UI should be famliar if you have used TikZiT before. If you are not familiar with TikZiT, press `?` to see a list of keyboard shortcuts, and have a look at the [Quickstart guide](https://tikzit.github.io/#quickstart) to get an overview of how things work. While these docs are written for the desktop application, all the main features are the same in this extension.

TikZiT expects your workspace to be a LaTeX project set up similarly to the [TikZiT template](https://github.com/tikzit/template-quantum). Namely, `.tikz` files are stored in a `figures/` subdirectory, and the route directory additionally contains [tikzit.sty](https://github.com/tikzit/template-quantum/blob/master/tikzit.sty), as well as a `.tikzstyles`, and optionally a `.tikzdefs`.

The `.tikzstyles` file is used to define styles for nodes and edges. This is used both by the TikZiT UI and should be `\input`-ed directly into your LaTeX document. To edit styles, simply open the `.tikzstyles` file in VS Code. All of the properties TikZiT recognizes are editable in the the style editor UI, but may also want to edit this file directly. Double-clicking any style in the style editor will open the source code at the appropriate line.

## Preview and Sync

Like the desktop application, the TikZiT extension provides the ability to build and preview diagrams. Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac) to build the current diagram. This will create a PDF file in the `cache/` subdirectory of your workspace. Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac) to open a preview of the PDF. If you have installed the [LaTeX Workshop](https://marketplace.visualstudio.com/items?itemName=James-Yu.latex-workshop) extension, the preview will open in VS Code and will automatically update whenever you rebuild the diagram.

For TikZ previews, I find it is most convenient to configure the LaTeX Workshop PDF viewer to zoom to page width. You can do this by adding the following line to your `settings.json` file:

```json
  "latex-workshop.view.pdf.zoom": "page-width",
```

Unlike the desktop application, the VS Code extension has features to automatically sync your entire figures directory with prebuild PDFs in `cache`. This is especially useful if you are using draft mode for `tikzit.sty`, via `\usepackage[draft]{tikzit}`. In draft mode, the LaTeX document will include prebuilt PDFs instead of the full TikZ code (if available), which can significantly reduce build time.

To start syncing, open the command palette and select "TikZiT: Sync TikZ Figures". This will watch your `figures/` directory for changes to `.tikz` files, and automatically build the corresponding PDFs in `cache/`. You can stop syncing at any time by selecting "TikZiT: Stop Syncing Figures" from the command palette. 

Both the build and sync commands have variants that will build to SVG instead of PDF, e.g. for use on the web or in [HTML slides](https://www.cs.ox.ac.uk/people/aleks.kissinger/slides/zx/pqs-zx-seminar-sept2025-60min.html). These are both available from the command palette.

## TODO

The extension is nearly at feature parity with the desktop application, but there are still some things to do:

- [ ] Rotate and reflect selection
- [ ] Move nodes/edges up and down in the Z-order
- [ ] More UI support and testing for multi-edge/filled paths
- [ ] Customization via user settings (colors, paths, keybindings, etc)
- [ ] Automatically crash editor when `B` key is pressed (currently not planned)

## Development

To set up a development environment, you just need `npm` and `git`. Clone the repository, then run `npm install` to install dependencies. You can then open the project in VS Code and press `F5` to launch a new VS Code window with the extension loaded. Open a `.tikz` file to try it out. Useful `npm` scripts are:

- `npm run build` - Build the extension and webview
- `npm run watch` - Build the extension and webview, then watch for changes
- `npm run lint` - Run the linter
- `npm run test` - Run unit tests
- `npm run package` - Create a `.vsix` file for distribution

There are also build scripts for a standalone version that runs in the browser. This can be run using `npm run preview`. This is currently just experimental, but I may find some use for it in the future.