import { ParseError } from "./TikzParser";

export default interface TikzitHost {
  onUpdateToGui(handler: (source: string) => void): void;
  updateFromGui(tikz: string): void;
  onTikzStylesUpdated(handler: (filename: string, styles: string) => void): void;
  setErrors(errors: ParseError[]): void;
  refreshTikzStyles(): void;
  openTikzStyles(): void;
  openCodeEditor(position?: { line: number; column: number }): void;

  // communication with style panel
  setValue(key: string, value: string, apply: boolean): void;
  onValueChanged(handler: (key: string, value: string, apply: boolean) => void): void;
}
