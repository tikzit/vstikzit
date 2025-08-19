import { OrderedMap } from "immutable";
import { StyleData } from "./Data";

class Styles {
  private _styleData: OrderedMap<string, StyleData>;
  private _filename: string = "";

  constructor(styles?: Styles) {
    this._styleData = styles?._styleData ?? OrderedMap<string, StyleData>();
    this._filename = styles?._filename ?? "";
  }

  public get styleData(): OrderedMap<string, StyleData> {
    return this._styleData;
  }

  public get filename(): string {
    return this._filename;
  }

  public style(name: string): StyleData {
    return this._styleData.get(name) ?? new StyleData();
  }

  public setStyle(style: StyleData) {
    const s = new Styles(this);
    s._styleData = s._styleData.set(style.name, style);
    return s;
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
      s += `\\tikzstyle{${name}}=${style.tikz()}\n`;
    });
    return s;
  }

  /** This function inherits any identical data from the provided styles
   *
   * This helps reactive components recognise the same data via Object.is() after the graph
   * has been re-parsed.
   */
  public inheritDataFrom(other: Styles): Styles {
    const s = new Styles();
    s._filename = this._filename;
    s._styleData = this._styleData.map(d => {
      const d1 = other._styleData.get(d.name);
      return d1 !== undefined && d.equals(d1) ? d1 : d;
    });
    return s;
  }
}

export default Styles;
