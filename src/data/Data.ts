import { OrderedMap, List } from "immutable";

import { isValidPropertyVal } from "./TikzParser";

type Coord = readonly [number, number];

function wrapPropertyVal(val: string): string {
  return !val.includes("\n") && isValidPropertyVal(val) ? val : `{${val}}`;
}

class Data {
  protected _id: number;
  protected _map: OrderedMap<string, string | undefined>;

  constructor(data?: Data) {
    this._id = data?._id ?? -1;
    this._map = data?._map ?? OrderedMap<string, string | undefined>();
  }

  public get id(): number {
    return this._id;
  }

  public property(key: string): string | undefined {
    return this._map.get(key);
  }

  public atom(key: string): boolean {
    return this._map.has(key);
  }

  public toString(): string {
    if (this._map.isEmpty()) {
      return "";
    } else {
      let s = "[";
      let first = true;

      for (const [key, val] of this._map.entries()) {
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

class GraphData extends Data {
  constructor(data?: GraphData) {
    super(data);
  }

  public setId(id: number): GraphData {
    const d = new GraphData(this);
    d._id = id;
    return d;
  }

  public setProperty(key: string, value: string): GraphData {
    const d = new GraphData(this);
    d._map = d._map.set(key, value);
    return d;
  }

  public setAtom(key: string): GraphData {
    const d = new GraphData(this);
    d._map = d._map.set(key, undefined);
    return d;
  }

  public unset(key: string): GraphData {
    const d = new GraphData(this);
    d._map = d._map.delete(key);
    return d;
  }
}

class NodeData extends Data {
  private _coord: Coord;
  private _label: string;
  private _labelStart?: number;
  private _labelEnd?: number;

  public constructor(data?: NodeData) {
    super(data);
    this._coord = data?._coord ?? [0, 0];
    this._label = data?._label ?? "";
    this._labelStart = data?._labelStart;
    this._labelEnd = data?._labelEnd;
  }

  public setId(id: number): NodeData {
    const d = new NodeData(this);
    d._id = id;
    return d;
  }

  public setProperty(key: string, value: string): NodeData {
    const d = new NodeData(this);
    d._map = d._map.set(key, value);
    return d;
  }

  public setAtom(key: string): NodeData {
    const d = new NodeData(this);
    d._map = d._map.set(key, undefined);
    return d;
  }

  public unset(key: string): NodeData {
    const d = new NodeData(this);
    d._map = d._map.delete(key);
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
    const d = new NodeData(this);
    d._coord = coord;
    return d;
  }

  public setLabel(label: string): NodeData {
    const d = new NodeData(this);
    d._label = label;
    return d;
  }

  public setLabelStart(labelStart: number | undefined): NodeData {
    const d = new NodeData(this);
    d._labelStart = labelStart;
    return d;
  }

  public setLabelEnd(labelEnd: number | undefined): NodeData {
    const d = new NodeData(this);
    d._labelEnd = labelEnd;
    return d;
  }
}

class EdgeData extends Data {
  private _source: number;
  private _target: number;
  private _path: number;
  private _sourceAnchor?: string;
  private _targetAnchor?: string;
  private _edgeNode?: NodeData;

  constructor(data?: EdgeData) {
    super(data);
    this._source = data?._source ?? -1;
    this._target = data?._target ?? -1;
    this._path = data?._path ?? -1;
    this._sourceAnchor = data?._sourceAnchor;
    this._targetAnchor = data?._targetAnchor;
    this._edgeNode = data?._edgeNode;
  }

  public setId(id: number): EdgeData {
    const d = new EdgeData(this);
    d._id = id;
    return d;
  }

  public setProperty(key: string, value: string): EdgeData {
    const d = new EdgeData(this);
    d._map = d._map.set(key, value);
    return d;
  }

  public setAtom(key: string): EdgeData {
    const d = new EdgeData(this);
    d._map = d._map.set(key, undefined);
    return d;
  }

  public unset(key: string): EdgeData {
    const d = new EdgeData(this);
    d._map = d._map.delete(key);
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
    const d = new EdgeData(this);
    d._source = source;
    return d;
  }

  public setTarget(target: number): EdgeData {
    const d = new EdgeData(this);
    d._target = target;
    return d;
  }

  public setPath(path: number): EdgeData {
    const d = new EdgeData(this);
    d._path = path;
    return d;
  }

  public setSourceAnchor(sourceAnchor: string | undefined): EdgeData {
    const d = new EdgeData(this);
    d._sourceAnchor = sourceAnchor;
    return d;
  }

  public setTargetAnchor(targetAnchor: string | undefined): EdgeData {
    const d = new EdgeData(this);
    d._targetAnchor = targetAnchor;
    return d;
  }

  public setEdgeNode(edgeNode: NodeData | undefined): EdgeData {
    const d = new EdgeData(this);
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
  private _isCycle: boolean;

  constructor(data?: PathData) {
    this._id = data?._id ?? -1;
    this._edges = data?._edges ?? List();
    this._isCycle = data?._isCycle ?? false;
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
    const p = new PathData(this);
    p._id = id;
    return p;
  }

  public setEdges(edges: List<number>): PathData {
    const p = new PathData(this);
    p._edges = edges;
    return p;
  }

  public setIsCycle(isCycle: boolean): PathData {
    const p = new PathData(this);
    p._isCycle = isCycle;
    return p;
  }

  public addEdge(edge: number): PathData {
    const p = new PathData(this);
    p._edges = p._edges.push(edge);
    return p;
  }

  public removeEdge(index: number): PathData {
    const p = new PathData(this);
    p._edges = p._edges.filter((_, i) => i !== index);
    return p;
  }
}

class StyleData extends Data {
  private _name: string;

  constructor(data?: StyleData) {
    super(data);
    this._name = data?._name ?? "";
  }

  public setId(id: number): StyleData {
    const d = new StyleData(this);
    d._id = id;
    return d;
  }

  public setProperty(key: string, value: string): StyleData {
    const d = new StyleData(this);
    d._map = d._map.set(key, value);
    return d;
  }

  public setAtom(key: string): StyleData {
    const d = new StyleData(this);
    d._map = d._map.set(key, undefined);
    return d;
  }

  public unset(key: string): StyleData {
    const d = new StyleData(this);
    d._map = d._map.delete(key);
    return d;
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

export { GraphData, NodeData, EdgeData, StyleData, PathData, Coord };
