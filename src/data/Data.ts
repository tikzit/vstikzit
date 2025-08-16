import { isValidPropertyVal } from "./TikzParser";

type Coord = [number, number];

class Data {
  public id: number;
  private pairs: [string, string | undefined][];

  constructor(id: number) {
    this.id = id;
    this.pairs = [];
  }

  public setProperty(key: string, value: string): void {
    const i = this.pairs.findIndex(pair => pair[0] === key);
    if (i !== -1) {
      this.pairs[i][1] = value;
    } else {
      this.pairs.push([key, value]);
    }
  }

  public setAtom(key: string): void {
    const i = this.pairs.findIndex(pair => pair[0] === key);
    if (i === -1) {
      this.pairs.push([key, undefined]);
    }
  }

  public unsetAtom(key: string): void {
    const i = this.pairs.findIndex(pair => pair[0] === key);
    if (i !== -1) {
      this.pairs.splice(i, 1);
    }
  }

  public property(key: string): string | undefined {
    const pair = this.pairs.find(pair => pair[0] === key);
    return pair !== undefined ? pair[1] : undefined;
  }

  public atom(key: string): boolean {
    const i = this.pairs.findIndex(pair => pair[0] === key);
    return i !== -1;
  }

  public toString(): string {
    if (this.pairs.length === 0) {
      return "";
    } else {
      let s = "[";
      let first = true;

      for (const p of this.pairs) {
        if (!first) {
          s += ", ";
        } else {
          first = false;
        }

        if (p[1] !== undefined) {
          let val = p[1];
          if (val.includes("\n") || !isValidPropertyVal(val)) {
            val = `{${val}}`;
          }
          s += `${p[0]}=${val}`;
        } else {
          s += `${p[0]}`;
        }
      }

      s += "]";
      return s;
    }
  }

  public tikz(): string {
    return this.toString();
  }
}

class NodeData extends Data {
  public inEdges: string[] = [];
  public outEdges: string[] = [];
  public coord: Coord = [0, 0];
  public label: string = "";
  public labelStart?: number;
  public labelEnd?: number;
}

class EdgeData extends Data {
  public source: number = -1;
  public target: number = -1;
  public path: number = -1;
  public sourceAnchor?: string;
  public targetAnchor?: string;
  public edgeNode?: NodeData;

  public sourceRef(): string {
    return this.sourceAnchor ? `(${this.source}.${this.sourceAnchor})` : `(${this.source})`;
  }

  public targetRef(): string {
    return this.targetAnchor ? `(${this.target}.${this.targetAnchor})` : `(${this.target})`;
  }
}

class PathData {
  public id: number;
  public edges: number[] = [];
  public isCycle: boolean = false;

  constructor(id: number) {
    this.id = id;
  }
}

class StyleData extends Data {
  public name: string = "";
}

export { Data, NodeData, EdgeData, StyleData, PathData, Coord };
