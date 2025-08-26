import { OrderedMap, List, ValueObject } from "immutable";

import { isValidPropertyVal } from "./TikzParser";

class Coord implements ValueObject {
  private _x: number;
  private _y: number;

  constructor(x: number, y: number) {
    this._x = x;
    this._y = y;
  }

  public get x(): number {
    return this._x;
  }

  public get y(): number {
    return this._y;
  }

  public equals(other: Coord): boolean {
    return this._x === other._x && this._y === other._y;
  }

  public hashCode(): number {
    return ((this._x * 397) ^ this._y) | 0;
  }

  public shift(dx: number, dy: number): Coord {
    return new Coord(this._x + dx, this._y + dy);
  }

  public snapToGrid(size: number): Coord {
    return new Coord(Math.round(this._x / size) * size, Math.round(this._y / size) * size);
  }
}

function wrapPropertyVal(val: string): string {
  return !val.includes("\n") && isValidPropertyVal(val) ? val : `{${val}}`;
}

class Data<T extends Data<T>> {
  protected _id: number;
  protected _map: OrderedMap<string, string | undefined>;

  constructor(data?: T) {
    this._id = data?._id ?? -1;
    this._map = data?._map ?? OrderedMap<string, string | undefined>();
  }

  public equals(other: T): boolean {
    return this._id === other._id && this._map.equals(other._map);
  }

  public hashCode(): number {
    return (this._map.hashCode() * 37 + this._id) | 0;
  }

  public get id(): number {
    return this._id;
  }

  public property(key: string): string | undefined {
    return this._map.get(key);
  }

  public propertyInt(key: string): number | undefined {
    const val = this.property(key);
    return val !== undefined ? parseInt(val, 10) : undefined;
  }

  public propertyFloat(key: string): number | undefined {
    const val = this.property(key);
    return val !== undefined ? parseFloat(val) : undefined;
  }

  public hasKey(key: string): boolean {
    return this._map.has(key);
  }

  public setId(id: number): T {
    const d = new (this.constructor as any)(this);
    d._id = id;
    return d;
  }

  public setProperty(key: string, value: string): T {
    const d = new (this.constructor as any)(this);
    d._map = d._map.set(key, value);
    return d;
  }

  public setAtom(key: string): T {
    const d = new (this.constructor as any)(this);
    d._map = d._map.set(key, undefined);
    return d;
  }

  public unset(key: string): T {
    const d = new (this.constructor as any)(this);
    d._map = d._map.delete(key);
    return d;
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

class GraphData extends Data<GraphData> {
  constructor(data?: GraphData) {
    super(data);
  }
}

class NodeData extends Data<NodeData> implements ValueObject {
  private _coord: Coord;
  private _label: string;

  public constructor(data?: NodeData) {
    super(data);
    this._coord = data?._coord ?? new Coord(0, 0);
    this._label = data?._label ?? "";
  }

  public equals(other: NodeData): boolean {
    return super.equals(other) && this._coord.equals(other._coord) && this._label === other._label;
  }

  public get coord(): Coord {
    return this._coord;
  }

  public get label(): string {
    return this._label;
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
}

class EdgeData extends Data<EdgeData> implements ValueObject {
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

  public equals(other: EdgeData): boolean {
    return (
      super.equals(other) &&
      this._source === other._source &&
      this._target === other._target &&
      this._path === other._path &&
      this._sourceAnchor === other._sourceAnchor &&
      this._targetAnchor === other._targetAnchor &&
      this._edgeNode === other._edgeNode
    );
  }

  public get source(): number {
    return this._source;
  }

  public get target(): number {
    return this._target;
  }

  public get isSelfLoop(): boolean {
    return this._source === this._target;
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

  public get basicBendMode(): boolean {
    return this.property("in") === undefined || this.property("out") === undefined;
  }
}

class PathData implements ValueObject {
  private _id: number;
  private _edges: List<number>;
  private _isCycle: boolean;

  constructor(data?: PathData) {
    this._id = data?._id ?? -1;
    this._edges = data?._edges ?? List();
    this._isCycle = data?._isCycle ?? false;
  }

  public equals(other: PathData): boolean {
    return (
      this._id === other._id && this._edges.equals(other._edges) && this._isCycle === other._isCycle
    );
  }

  public hashCode(): number {
    return ((this._id * 397) ^ this._edges.hashCode() ^ (this._isCycle ? 1 : 0)) | 0;
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

type ArrowTipStyle = "pointer" | "flat" | "none";

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

  public get arrowHead(): ArrowTipStyle {
    if (this.hasKey("->") || this.hasKey("<->") || this.hasKey("|->")) {
      return "pointer";
    } else if (this.hasKey("-|") || this.hasKey("<-|") || this.hasKey("|-|")) {
      return "flat";
    } else {
      return "none";
    }
  }

  public get arrowTail(): ArrowTipStyle {
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

export { GraphData, NodeData, EdgeData, PathData, Coord, StyleData };
