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
}

export default Styles;
