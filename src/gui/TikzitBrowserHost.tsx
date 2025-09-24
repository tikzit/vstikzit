import { render } from "preact";
import { TikzEditorContent } from "./TikzEditor";
import StyleEditor, { StyleEditorContent } from "./StyleEditor";
import "./defaultvars.css";
import "./gui.css";
import { ParseError } from "../lib/TikzParser";
import TikzitHost from "../lib/TikzitHost";
import App from "./App";

class TikzitBrowserHost implements TikzitHost {
  private updateFromGuiHandler: ((source: string) => void) | undefined = undefined;
  private updateToGuiHandler: ((source: string) => void) | undefined = undefined;
  private tikzStylesUpdatedHandler: ((filename: string, source: string) => void) | undefined =
    undefined;

  public onTikzStylesUpdated(handler: (filename: string, source: string) => void) {
    this.tikzStylesUpdatedHandler = handler;
  }

  public setErrors(errors: ParseError[]) { }

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

  public refreshTikzStyles() { }

  public openTikzStyles() { }

  public openCodeEditor(position?: { line: number; column: number }) { }

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
