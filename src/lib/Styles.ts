import { Style } from "util";
import { StyleData } from "./Data";

class Styles {
  private _styleData: Map<string, StyleData>;
  private _filename: string = "";

  constructor(styles?: Styles) {
    this._styleData = styles !== undefined ? new Map(styles._styleData) : new Map();
    this._filename = styles?._filename ?? "";
  }

  // public get styleData(): Map<string, StyleData> {
  //   return this._styleData;
  // }

  public get filename(): string {
    return this._filename;
  }

  public get styles(): StyleData[] {
    return Array.from(this._styleData.values());
  }

  public style(name: string | undefined): StyleData {
    if (name === undefined) {
      return new StyleData();
    } else {
      return this._styleData.get(name) ?? new StyleData();
    }
  }

  public hasStyle(name: string): boolean {
    return this._styleData.has(name);
  }

  public deleteStyle(name: string) {
    if (!this._styleData.has(name)) {
      return this;
    }
    const s = new Styles(this);
    s._styleData.delete(name);
    return s;
  }

  public addStyle(style: StyleData) {
    const s = new Styles(this);
    s._styleData.set(style.name, style);
    return s;
  }

  public updateStyle(style: StyleData) {
    return this.addStyle(style);
  }

  public setFilename(filename: string) {
    const s = new Styles(this);
    s._filename = filename;
    return s;
  }

  public numStyles(): number {
    return this._styleData.size;
  }

  public tikz(): string {
    let s = "";
    this._styleData.forEach((style, name) => {
      if (name !== "none") {
        s += `\\tikzstyle{${name}}=${style.tikz()}\n`;
      }
    });
    return s;
  }

  /** This function inherits any identical data from the provided styles
   *
   * This helps reactive components recognise the same data via Object.is() after the graph
   * has been re-parsed.
   */
  public inheritDataFrom(other: Styles): Styles {
    const s = new Styles(this);
    const keys = Array.from(this._styleData.keys());
    for (const key of keys) {
      const d = other._styleData.get(key)!;
      if (this._styleData.get(key)?.equals(d)) {
        s._styleData.set(key, d);
      }
    }
    return s;
  }

  public get firstStyle(): string | undefined {
    return Array.from(this._styleData.keys()).find(s => s !== "none");
  }
}

export default Styles;
