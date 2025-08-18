import { StyleData } from "./Data";

class Styles {
  public styles: string[] = [];
  public styleData: Map<string, StyleData> = new Map();
  public filename: string = "";

  public addStyle(style: StyleData) {
    this.styles.push(style.name);
    this.styleData.set(style.name, style);
  }

  public numStyles(): number {
    return this.styles.length;
  }
}

export default Styles;
