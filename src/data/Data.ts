import { OrderedMap, List } from "immutable";

import { isValidPropertyVal } from "./TikzParser";

type Coord = readonly [number, number];

function wrapPropertyVal(val: string): string {
  return !val.includes("\n") && isValidPropertyVal(val) ? val : `{${val}}`;
}

class Data<T extends Data<T>> {
  private _id: number;
  private map: OrderedMap<string, string | undefined>;

  constructor(id?: number, map?: OrderedMap<string, string | undefined>) {
    this._id = id ?? -1;
    this.map = map ?? OrderedMap<string, string | undefined>();
  }

  public get id(): number {
    return this._id;
  }

  public copy(): T {
    return new Data(this.id, this.map) as T;
  }

  public setId(id: number): T {
    const d = this.copy();
    d._id = id;
    return d;
  }

  public setProperty(key: string, value: string): T {
    const d = this.copy();
    d.map = d.map.set(key, value);
    return d;
  }

  public setAtom(key: string): T {
    const d = this.copy();
    d.map = d.map.set(key, undefined);
    return d;
  }

  public unset(key: string): T {
    const d = this.copy();
    d.map = d.map.delete(key);
    return d;
  }

  public property(key: string): string | undefined {
    return this.map.get(key);
  }

  public atom(key: string): boolean {
    return this.map.has(key);
  }

  public toString(): string {
    if (this.map.isEmpty()) {
      return "";
    } else {
      let s = "[";
      let first = true;

      for (const [key, val] of this.map.entries()) {
        if (!first) {
          s += ", ";
        } else {
          first = false;
        }

        if (val !== undefined) {
          s += `${wrapPropertyVal(key)}=${wrapPropertyVal(val)}`;
        } else {
          s += `${wrapPropertyVal(key)}`;
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

class GraphData extends Data<GraphData> {}

class NodeData extends Data<NodeData> {
  private _coord: Coord = [0, 0];
  private _label: string = "";
  private _labelStart?: number;
  private _labelEnd?: number;

  public copy(): NodeData {
    const d = super.copy();
    d._coord = this._coord;
    d._label = this._label;
    d._labelStart = this._labelStart;
    d._labelEnd = this._labelEnd;
    return d;
  }

  public get coord(): Coord {
    return this._coord;
  }

  public get label(): string {
    return this._label;
  }

  public get labelStart(): number | undefined {
    return this._labelStart;
  }

  public get labelEnd(): number | undefined {
    return this._labelEnd;
  }

  public setCoord(coord: Coord): NodeData {
    const d = this.copy();
    d._coord = coord;
    return d;
  }

  public setLabel(label: string): NodeData {
    const d = this.copy();
    d._label = label;
    return d;
  }

  public setLabelStart(labelStart: number | undefined): NodeData {
    const d = this.copy();
    d._labelStart = labelStart;
    return d;
  }

  public setLabelEnd(labelEnd: number | undefined): NodeData {
    const d = this.copy();
    d._labelEnd = labelEnd;
    return d;
  }
}

class EdgeData extends Data<EdgeData> {
  private _source: number = -1;
  private _target: number = -1;
  private _path: number = -1;
  private _sourceAnchor?: string;
  private _targetAnchor?: string;
  private _edgeNode?: NodeData;

  public copy(): EdgeData {
    const d = super.copy();
    d._source = this._source;
    d._target = this._target;
    d._path = this._path;
    d._sourceAnchor = this._sourceAnchor;
    d._targetAnchor = this._targetAnchor;
    d._edgeNode = this._edgeNode;
    return d;
  }

  public get source(): number {
    return this._source;
  }

  public get target(): number {
    return this._target;
  }

  public get path(): number {
    return this._path;
  }

  public get sourceAnchor(): string | undefined {
    return this._sourceAnchor;
  }

  public get targetAnchor(): string | undefined {
    return this._targetAnchor;
  }

  public get edgeNode(): NodeData | undefined {
    return this._edgeNode;
  }

  public setSource(source: number): EdgeData {
    const d = this.copy();
    d._source = source;
    return d;
  }

  public setTarget(target: number): EdgeData {
    const d = this.copy();
    d._target = target;
    return d;
  }

  public setPath(path: number): EdgeData {
    const d = this.copy();
    d._path = path;
    return d;
  }

  public setSourceAnchor(sourceAnchor: string | undefined): EdgeData {
    const d = this.copy();
    d._sourceAnchor = sourceAnchor;
    return d;
  }

  public setTargetAnchor(targetAnchor: string | undefined): EdgeData {
    const d = this.copy();
    d._targetAnchor = targetAnchor;
    return d;
  }

  public setEdgeNode(edgeNode: NodeData | undefined): EdgeData {
    const d = this.copy();
    d._edgeNode = edgeNode;
    return d;
  }

  public get sourceRef(): string {
    return this._sourceAnchor ? `(${this._source}.${this._sourceAnchor})` : `(${this._source})`;
  }

  public get targetRef(): string {
    return this._targetAnchor ? `(${this._target}.${this._targetAnchor})` : `(${this._target})`;
  }
}

class PathData {
  private _id: number;
  private _edges: List<number>;
  private _isCycle: boolean = false;

  constructor(id?: number) {
    this._id = id ?? -1;
    this._edges = List();
  }

  public copy(): PathData {
    const p = new PathData(this._id);
    p._edges = this._edges;
    p._isCycle = this._isCycle;
    return p;
  }

  public get id(): number {
    return this._id;
  }

  public get edges(): List<number> {
    return this._edges;
  }

  public get isCycle(): boolean {
    return this._isCycle;
  }

  public setId(id: number): PathData {
    const p = this.copy();
    p._id = id;
    return p;
  }

  public setEdges(edges: List<number>): PathData {
    const p = this.copy();
    p._edges = edges;
    return p;
  }

  public setIsCycle(isCycle: boolean): PathData {
    const p = this.copy();
    p._isCycle = isCycle;
    return p;
  }

  public addEdge(edge: number): PathData {
    const p = this.copy();
    p._edges = p._edges.push(edge);
    return p;
  }

  public removeEdge(index: number): PathData {
    const p = this.copy();
    p._edges = this._edges.filter((_, i) => i !== index);
    return p;
  }
}

class StyleData extends Data<StyleData> {
  private _name: string = "";

  public get name(): string {
    return this._name;
  }

  public setName(name: string): StyleData {
    const d = this.copy();
    d._name = name;
    return d;
  }
}

export { GraphData, NodeData, EdgeData, StyleData, PathData, Coord };
