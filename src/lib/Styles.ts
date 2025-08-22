import { OrderedMap } from "immutable";
import Data from "./Data";

type ArrowTypeStyle = "pointer" | "flat" | "none";

class StyleData extends Data<StyleData> {
  private _name: string;

  constructor(data?: StyleData) {
    super(data);
    this._name = data?._name ?? "none";
  }

  public get isNone(): boolean {
    return this._name === "none";
  }

  public get isEdgeStyle(): boolean {
    return (
      this.hasKey("-") ||
      this.hasKey("->") ||
      this.hasKey("-|") ||
      this.hasKey("<-") ||
      this.hasKey("<->") ||
      this.hasKey("<-|") ||
      this.hasKey("|-") ||
      this.hasKey("|->") ||
      this.hasKey("|-|")
    );
  }

  public get arrowHead(): ArrowTypeStyle {
    if (this.hasKey("->") || this.hasKey("<->") || this.hasKey("|->")) {
      return "pointer";
    } else if (this.hasKey("-|") || this.hasKey("<-|") || this.hasKey("|-|")) {
      return "flat";
    } else {
      return "none";
    }
  }

  public get arrowTail(): ArrowTypeStyle {
    if (this.hasKey("<-") || this.hasKey("<->") || this.hasKey("<-|")) {
      return "pointer";
    } else if (this.hasKey("|-") || this.hasKey("|->") || this.hasKey("|-|")) {
      return "flat";
    } else {
      return "none";
    }
  }

  public equals(other: StyleData): boolean {
    return super.equals(other) && this._name === other._name;
  }

  public get name(): string {
    return this._name;
  }

  public setName(name: string): StyleData {
    const d = new StyleData(this);
    d._name = name;
    return d;
  }
}

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

  public addStyle(style: StyleData) {
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
    const s = new Styles();
    s._filename = this._filename;
    s._styleData = this._styleData.map(d => {
      const d1 = other._styleData.get(d.name);
      return d1 !== undefined && d.equals(d1) ? d1 : d;
    });
    return s;
  }
}

export { StyleData };
export default Styles;
