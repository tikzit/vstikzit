import { render } from "preact";
import TikzEditor, { TikzEditorContent } from "./TikzEditor";
import StyleEditor, { StyleEditorContent } from "./StyleEditor";
import "./defaultvars.css";
import "./gui.css";
import { ParseError } from "../lib/TikzParser";
import TikzitHost from "../lib/TikzitHost";

// VSCode WebView API (should be available globally in webview context)
declare const acquireVsCodeApi: () => any;

class TikzitBrowserHost implements TikzitHost {
  private vscode: VsCodeApi;
  private listener: ((event: MessageEvent) => void) | undefined = undefined;
  private tikzUpdatedHandler: ((source: string) => void) | undefined = undefined;
  private tikzStylesUpdatedHandler: ((filename: string, source: string) => void) | undefined =
    undefined;
  constructor() {
    this.vscode = acquireVsCodeApi();
    this.listener = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "updateToGui": {
          if (message.content && this.tikzUpdatedHandler) {
            this.tikzUpdatedHandler(message.content);
          }
          break;
        }
        case "tikzStylesContent": {
          if (message.content && this.tikzStylesUpdatedHandler) {
            this.tikzStylesUpdatedHandler(message.content.filename, message.content.source);
          }
          break;
        }
      }
    };

    window.addEventListener("message", this.listener);
  }

  destroy() {
    window.removeEventListener("message", this.listener!);
  }

  public onSourceUpdated(handler: (source: string) => void) {
    this.tikzUpdatedHandler = handler;
  }

  public onTikzStylesUpdated(handler: (filename: string, source: string) => void) {
    this.tikzStylesUpdatedHandler = handler;
  }

  public setErrors(errors: ParseError[]) {
    this.vscode.postMessage({
      type: "setErrors",
      content: errors.map(e => ({
        line: e.line - 1,
        column: e.column - 1,
        message: e.message,
      })),
    });
  }

  public updateSource(tikz: string) {
    this.vscode.postMessage({
      type: "updateFromGui",
      content: tikz,
    });
  }

  public refreshTikzStyles() {
    this.vscode.postMessage({
      type: "refreshTikzStyles",
    });
  }

  public openTikzStyles() {
    this.vscode.postMessage({
      type: "openTikzStyles",
    });
  }

  public openCodeEditor(position?: { line: number; column: number }) {
    this.vscode.postMessage({
      type: "openCodeEditor",
      content: position ?? { line: 0, column: 0 },
    });
  }

  public renderTikzEditor(container: HTMLElement, initialContent: TikzEditorContent) {
    try {
      render(<TikzEditor initialContent={initialContent} host={this} />, container);
    } catch (error) {
      console.error("Error rendering TikzEditor:", error);
      container.innerHTML = `<div style="padding: 20px; color: red;">${error}</div>`;
    }
  }

  public renderStyleEditor(container: HTMLElement, initialContent: StyleEditorContent) {
    try {
      render(<StyleEditor initialContent={initialContent} host={this} />, container);
    } catch (error) {
      console.error("Error rendering StyleEditor:", error);
      container.innerHTML = `<div style="padding: 20px; color: red;">${error}</div>`;
    }
  }
}

export { TikzitBrowserHost };
