import { render } from "preact";
import { TikzEditorContent } from "./TikzEditor";
import StyleEditor, { StyleEditorContent } from "./StyleEditor";
import "./defaultvars.css";
import "./gui.css";
import { ParseError } from "../lib/TikzParser";
import TikzitHost from "../lib/TikzitHost";
import { StylePanelState } from "./StylePanel";
import App from "./App";

// one TikzitBrowserHost instance is created globally. This mimics the VSCode extension host API
// by passing messages directly between editors, the StylePanel, and the DOM
class TikzitBrowserHost implements TikzitHost {
  private updateFromGuiHandler: ((source: string) => void) | undefined = undefined;
  private updateToGuiHandler: ((source: string) => void) | undefined = undefined;
  private tikzStylesUpdatedHandler: ((filename: string, source: string) => void) | undefined =
    undefined;
  public onTikzStylesUpdated(handler: (filename: string, source: string) => void) {
    this.tikzStylesUpdatedHandler = handler;
  }

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

  public setErrors(errors: ParseError[]) {}

  public updateFromGui(tikz: string) {
    // console.log("updateFromGui: ", this.updateFromGuiHandler !== undefined);
    if (this.updateFromGuiHandler) {
      this.updateFromGuiHandler(tikz);
    }
  }

  public updateToGui(tikz: string) {
    // console.log("updateToGui: ", this.updateToGuiHandler !== undefined);
    if (this.updateToGuiHandler) {
      this.updateToGuiHandler(tikz);
    }
  }

  public onUpdateFromGui(handler: (tikz: string) => void) {
    this.updateFromGuiHandler = handler;
  }

  public onUpdateToGui(handler: (source: string) => void) {
    this.updateToGuiHandler = handler;
  }

  public refreshTikzStyles() {}

  public openTikzStyles() {}

  public openCodeEditor(position?: { line: number; column: number }) {}

  public renderTikzEditor(container: HTMLElement, initialContent: TikzEditorContent) {
    try {
      render(<App initialContent={initialContent} host={this} />, container);
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
