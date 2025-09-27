import { render } from "preact";
import TikzEditor, { TikzEditorContent } from "./TikzEditor";
import StyleEditor, { StyleEditorContent } from "./StyleEditor";
import "./vscodevars.css";
import "./gui.css";
import { ParseError } from "../lib/TikzParser";
import TikzitHost from "../lib/TikzitHost";
import StylePanel, { StylePanelState } from "./StylePanel";

// VSCode WebView API (should be available globally in webview context)
declare const acquireVsCodeApi: () => any;

// one TikzitExtensionHost instance is created per webview. Communication between webviews is
// done via vscode extension messages.
class TikzitExtensionHost implements TikzitHost {
  private vscode: VsCodeApi;
  private listener: ((event: MessageEvent) => void) | undefined = undefined;
  private updateToGuiHandler: ((source: string) => void) | undefined = undefined;

  // communication with style panel
  private messageToStylePanelHandler: ((message: StylePanelState) => void) | undefined = undefined;
  private messageFromStylePanelHandler: ((message: StylePanelState) => void) | undefined =
    undefined;
  messageToStylePanel(message: StylePanelState): void {
    this.messageToStylePanelHandler?.(message);
  }
  onMessageToStylePanel(handler: (message: StylePanelState) => void): void {
    this.messageToStylePanelHandler = handler;
  }
  messageFromStylePanel(message: StylePanelState): void {
    this.messageFromStylePanelHandler?.(message);
  }
  onMessageFromStylePanel(handler: (message: StylePanelState) => void): void {
    this.messageFromStylePanelHandler = handler;
  }

  private tikzStylesUpdatedHandler: ((filename: string, source: string) => void) | undefined =
    undefined;
  constructor() {
    this.vscode = acquireVsCodeApi();
    this.listener = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "updateToGui": {
          if (message.content && this.updateToGuiHandler) {
            this.updateToGuiHandler(message.content);
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

  public onUpdateToGui(handler: (source: string) => void) {
    this.updateToGuiHandler = handler;
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

  public updateFromGui(tikz: string) {
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

  public renderStylePanel(container: HTMLElement) {
    try {
      render(<StylePanel host={this} />, container);
    } catch (error) {
      console.error("Error rendering StylePanel:", error);
      container.innerHTML = `<div style="padding: 20px; color: red;">${error}</div>`;
    }
  }
}

export { TikzitExtensionHost };
