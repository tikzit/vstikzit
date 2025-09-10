import { arrayEquals, StyleData } from "./Data";

class Styles {
  private _nodeStyles: StyleData[];
  private _edgeStyles: StyleData[];
  private _filename: string = "";

  constructor(styles?: Styles) {
    this._nodeStyles = styles !== undefined ? [...styles._nodeStyles] : [];
    this._edgeStyles = styles !== undefined ? [...styles._edgeStyles] : [];
    this._filename = styles?._filename ?? "";
  }

  public equals(other: Styles): boolean {
    return this._filename === other._filename &&
      arrayEquals(this._nodeStyles, other._nodeStyles) &&
      arrayEquals(this._edgeStyles, other._edgeStyles);
  }

  // public get styleData(): Map<string, StyleData> {
  //   return this._styleData;
  // }

  public get filename(): string {
    return this._filename;
  }

  public get nodeStyles(): StyleData[] {
    return [...this._nodeStyles];
  }

  public get edgeStyles(): StyleData[] {
    return [...this._edgeStyles];
  }

  public get styles(): StyleData[] {
    return [...this._nodeStyles, ...this._edgeStyles];
  }

  public style(name: string | undefined): StyleData {
    if (name === undefined) {
      return new StyleData();
    } else {
      return this._nodeStyles.find(style => style.name === name) ?? this._edgeStyles.find(style => style.name === name) ?? new StyleData();
    }
  }

  public hasStyle(name: string): boolean {
    return this._nodeStyles.some(style => style.name === name) || this._edgeStyles.some(style => style.name === name);
  }

  public deleteStyle(name: string) {
    if (!this.hasStyle(name)) {
      return this;
    }
    const s = new Styles(this);
    s._nodeStyles = s._nodeStyles.filter(style => style.name !== name);
    s._edgeStyles = s._edgeStyles.filter(style => style.name !== name);
    return s;
  }

  public addStyle(style: StyleData): Styles {
    if (this.hasStyle(style.name)) {
      console.log(`Warning: style with name ${style.name} already exists, ignoring.`);
      return this;
    }

    const s = new Styles(this);
    if (style.isEdgeStyle) {
      s._edgeStyles.push(style);
    } else {
      s._nodeStyles.push(style);
    }
    return s;
  }

  public updateStyle(name: string, style: StyleData) {
    const i = this._nodeStyles.findIndex(s => s.name === name);
    const j = this._edgeStyles.findIndex(s => s.name === name);
    const s = new Styles(this);
    if (i !== -1) {
      if (!style.isEdgeStyle) {
        s._nodeStyles[i] = style;
      } else {
        s._nodeStyles.splice(i, 1);
        s._edgeStyles.push(style);
      }
    } else if (j !== -1) {
      if (style.isEdgeStyle) {
        s._edgeStyles[j] = style;
      } else {
        s._edgeStyles.splice(j, 1);
        s._nodeStyles.push(style);
      }
    } else {
      throw new Error(`Style with name ${style.name} does not exist.`);
    }

    return s;
  }

  public setFilename(filename: string) {
    const s = new Styles(this);
    s._filename = filename;
    return s;
  }

  public numStyles(): number {
    return this._nodeStyles.length + this._edgeStyles.length;
  }

  public tikzWithPosition(styleName?: string): [string, { line: number; column: number } | undefined] {
    let result = "";
    let position: { line: number; column: number } | undefined;
    this.styles.forEach(style => {
      if (style.name !== "none") {
        result += `\\tikzstyle{${style.name}}=`;

        if (style.name === styleName) {
          // return the position of the start of the property list
          const lines = result.split("\n");
          position = { line: lines.length - 1, column: lines[lines.length - 1].length };
        }

        result += style.tikz() + "\n";
      }
    });
    return [result, position];
  }

  public tikz(): string {
    return this.tikzWithPosition()[0];
  }

  public get firstStyleName(): string | undefined {
    return this.styles.find(s => s.name !== "none")?.name;
  }

  public moveStyleUp(name: string): Styles {
    const s = new Styles(this);
    const i = s._nodeStyles.findIndex(style => style.name === name);
    if (i > 0) {
      const temp = s._nodeStyles[i - 1];
      s._nodeStyles[i - 1] = s._nodeStyles[i];
      s._nodeStyles[i] = temp;
    }
    return s;
  }

  public moveStyleDown(name: string): Styles {
    const s = new Styles(this);
    const i = s._nodeStyles.findIndex(style => style.name === name);
    if (i !== -1 && i < s._nodeStyles.length - 1) {
      const temp = s._nodeStyles[i + 1];
      s._nodeStyles[i + 1] = s._nodeStyles[i];
      s._nodeStyles[i] = temp;
    }
    return s;
  }

  public get freshStyleName(): string {
    let i = 1;
    while (this.hasStyle(`new style ${i}`)) {
      i++;
    }
    return `new style ${i}`;
  }
}

export default Styles;
