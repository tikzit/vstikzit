import { render } from "preact";
import TikzEditor, { TikzEditorContent } from "./TikzEditor";
import StyleEditor, { StyleEditorContent } from "./StyleEditor";
import "./defaultvars.css";
import "./gui.css";
import { ParseError } from "../lib/TikzParser";
import TikzitHost from "../lib/TikzitHost";

class TikzitBrowserHost implements TikzitHost {
  private tikzUpdatedHandler: ((source: string) => void) | undefined = undefined;
  private tikzStylesUpdatedHandler: ((filename: string, source: string) => void) | undefined =
    undefined;

  public onSourceUpdated(handler: (source: string) => void) {
    this.tikzUpdatedHandler = handler;
  }

  public onTikzStylesUpdated(handler: (filename: string, source: string) => void) {
    this.tikzStylesUpdatedHandler = handler;
  }

  public setErrors(errors: ParseError[]) {}

  public updateSource(tikz: string) {}

  public refreshTikzStyles() {}

  public openTikzStyles() {}

  public openCodeEditor(position?: { line: number; column: number }) {}

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
