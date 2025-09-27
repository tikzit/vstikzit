import { ParseError } from "./TikzParser";

export interface StylePanelMessage {
  nodeStyle?: string;
  edgeStyle?: string;
  nodeLabel?: string;
  apply?: boolean;
}

export default interface TikzitHost {
  onUpdateToGui(handler: (source: string) => void): void;
  updateFromGui(tikz: string): void;
  onTikzStylesUpdated(handler: (filename: string, styles: string) => void): void;
  setErrors(errors: ParseError[]): void;
  refreshTikzStyles(): void;
  openTikzStyles(): void;
  openCodeEditor(position?: { line: number; column: number }): void;

  // communication with style panel
  messageToStylePanel(message: StylePanelMessage): void;
  onMessageToStylePanel(handler: (message: StylePanelMessage) => void): void;
  messageFromStylePanel(message: StylePanelMessage): void;
  onMessageFromStylePanel(handler: (message: StylePanelMessage) => void): void;
}
