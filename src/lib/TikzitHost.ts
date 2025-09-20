import { ParseError } from "./TikzParser";

export default interface TikzitHost {
  onSourceUpdated(handler: (source: string) => void): void;
  onTikzStylesUpdated(handler: (filename: string, styles: string) => void): void;
  setErrors(errors: ParseError[]): void;
  updateSource(tikz: string): void;
  refreshTikzStyles(): void;
  openTikzStyles(): void;
  openCodeEditor(position?: { line: number; column: number }): void;
}
