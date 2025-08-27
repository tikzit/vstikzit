import { List, OrderedMap, Seq, Set, ValueObject } from "immutable";
import { NodeData, EdgeData, PathData, GraphData } from "./Data";

class Graph implements ValueObject {
  private _graphData: GraphData = new GraphData();
  private _nodeData: OrderedMap<number, NodeData>;
  private _pathData: OrderedMap<number, PathData>;
  private _edgeData: OrderedMap<number, EdgeData>;
  private maxNodeId: number;
  private maxEdgeId: number;
  private maxPathId: number;

  constructor(graph?: Graph) {
    this._graphData = graph?._graphData ?? new GraphData();
    this._nodeData = graph?._nodeData ?? OrderedMap<number, NodeData>();
    this._edgeData = graph?._edgeData ?? OrderedMap<number, EdgeData>();
    this._pathData = graph?._pathData ?? OrderedMap<number, PathData>();
    this.maxNodeId = graph?.maxNodeId ?? -1;
    this.maxEdgeId = graph?.maxEdgeId ?? -1;
    this.maxPathId = graph?.maxPathId ?? -1;
  }

  private copy(): Graph {
    return new Graph(this);
  }

  public get graphData(): GraphData {
    return this._graphData;
  }

  public get nodeData(): OrderedMap<number, NodeData> {
    return this._nodeData;
  }

  public get edgeData(): OrderedMap<number, EdgeData> {
    return this._edgeData;
  }

  public get pathData(): OrderedMap<number, PathData> {
    return this._pathData;
  }

  public get nodes(): Seq.Indexed<number> {
    return this._nodeData.keySeq();
  }

  public get paths(): Seq.Indexed<number> {
    return this._pathData.keySeq();
  }

  public get edges(): Seq.Indexed<number> {
    return this._edgeData.keySeq();
  }

  public get numNodes(): number {
    return this._nodeData.size;
  }

  public get numEdges(): number {
    return this._edgeData.size;
  }

  public get numPaths(): number {
    return this._pathData.size;
  }

  public setGraphData(d: GraphData): Graph {
    const g = this.copy();
    g._graphData = d;
    return g;
  }

  public addNodeWithData(d: NodeData): Graph {
    const g = this.copy();
    g._nodeData = g._nodeData.set(d.id, d);
    if (d.id > g.maxNodeId) {
      g.maxNodeId = d.id;
    }
    return g;
  }

  public addEdgeWithData(d: EdgeData): Graph {
    const g = this.copy();
    g._edgeData = g._edgeData.set(d.id, d);
    if (d.id > g.maxEdgeId) {
      g.maxEdgeId = d.id;
    }
    return g;
  }

  public addPathWithData(d: PathData): Graph {
    const g = this.copy();
    g._pathData = g._pathData.set(d.id, d);
    if (d.id > g.maxPathId) {
      g.maxPathId = d.id;
    }
    return g;
  }

  public updateNodeData(id: number, fn: (data: NodeData) => NodeData): Graph {
    const node = this._nodeData.get(id);
    if (node) {
      const g = this.copy();
      g._nodeData = g._nodeData.set(id, fn(node));
      return g;
    } else {
      return this;
    }
  }

  public mapNodeData(fn: (data: NodeData) => NodeData): Graph {
    const g = this.copy();
    g._nodeData = g._nodeData.map(fn);
    return g;
  }

  public updateEdgeData(id: number, fn: (data: EdgeData) => EdgeData): Graph {
    const edge = this._edgeData.get(id);
    if (edge) {
      const g = this.copy();
      g._edgeData = g._edgeData.set(id, fn(edge));
      return g;
    } else {
      return this;
    }
  }

  public updatePathData(id: number, fn: (data: PathData) => PathData): Graph {
    const path = this._pathData.get(id);
    if (path) {
      const g = this.copy();
      g._pathData = g._pathData.set(id, fn(path));
      return g;
    } else {
      return this;
    }
  }

  public removeNodes(nodes: Iterable<number>): Graph {
    let g = this.copy();
    let nodeSet = Set(nodes);
    g._nodeData = g._nodeData.filter(d => !nodeSet.contains(d.id));
    g._edgeData = g._edgeData.filter(
      d => !nodeSet.contains(d.source) && !nodeSet.contains(d.target)
    );
    return g.removeDanglingPaths();
  }

  public removeEdges(edges: Iterable<number>): Graph {
    const g = this.copy();
    const edgeSet = Set(edges);
    g._edgeData = g._edgeData.filter(d => !edgeSet.contains(d.id));
    return g.removeDanglingPaths();
  }

  private removeDanglingPaths(): Graph {
    const g = this.copy();
    g._pathData = g._pathData
      .map(d => d.setEdges(d.edges.filter(e => g._edgeData.has(e))))
      .filter(p => !p.edges.isEmpty());
    return g;
  }

  public subgraphFromNodes(nodes: Iterable<number>): Graph {
    const nodeSet = Set(nodes);
    const nodeComp = this._nodeData.keySeq().filter(key => !nodeSet.contains(key));
    return this.removeNodes(nodeComp);
  }

  public get freshNodeId(): number {
    return this.maxNodeId + 1;
  }

  public get freshEdgeId(): number {
    return this.maxEdgeId + 1;
  }

  public get freshPathId(): number {
    return this.maxPathId + 1;
  }

  /** This function inherits any identical data from the provided graph
   *
   * This helps reactive components recognise the same data via Object.is() after the graph
   * has been re-parsed.
   */
  public inheritDataFrom(other: Graph): Graph {
    const g = new Graph();
    g.maxNodeId = this.maxNodeId;
    g.maxEdgeId = this.maxEdgeId;
    g.maxPathId = this.maxPathId;
    g._nodeData = this._nodeData.map(d => {
      const d1 = other._nodeData.get(d.id);
      return d1 !== undefined && d.equals(d1) ? d1 : d;
    });
    g._edgeData = this._edgeData.map(d => {
      const d1 = other._edgeData.get(d.id);
      return d1 !== undefined && d.equals(d1) ? d1 : d;
    });
    g._pathData = this._pathData.map(d => {
      const d1 = other._pathData.get(d.id);
      return d1 !== undefined && d.equals(d1) ? d1 : d;
    });
    return g;
  }

  public equals(other: Graph): boolean {
    return (
      this._nodeData.equals(other._nodeData) &&
      this._edgeData.equals(other._edgeData) &&
      this._pathData.equals(other._pathData) &&
      this.maxNodeId === other.maxNodeId &&
      this.maxEdgeId === other.maxEdgeId &&
      this.maxPathId === other.maxPathId
    );
  }

  public hashCode(): number {
    let hash = this.nodeData.hashCode();
    hash = hash * 31 + this.edgeData.hashCode();
    hash = hash * 31 + this.pathData.hashCode();
    return hash;
  }

  public tikz(): string {
    let result = "\\begin{tikzpicture}\n";
    result += "\t\\begin{pgfonlayer}{nodelayer}\n";
    for (const d of this.nodeData.values()) {
      if (d) {
        let dt = d.tikz();
        if (dt !== "") {
          dt += " ";
        }
        result += `\t\t\\node ${dt}(${d.id}) at (${d.coord.x}, ${d.coord.y}) {${d.label}};\n`;
      }
    }
    result += "\t\\end{pgfonlayer}\n";
    result += "\t\\begin{pgfonlayer}{edgelayer}\n";
    for (const pd of this.pathData.values()) {
      let d = this.edgeData.get(pd.edges.get(0)!)!;
      let edgeNode = d.edgeNode !== undefined ? ` node${d.edgeNode.tikz()}` : "";
      let dt = d.tikz();
      if (dt !== "") {
        dt += " ";
      }
      result += `\t\t\\draw ${dt}${d.sourceRef} to${edgeNode} ${d.targetRef}`;

      for (const edgeId of pd.edges.slice(1)) {
        d = this.edgeData.get(edgeId)!;
        edgeNode = d.edgeNode !== undefined ? ` node${d.edgeNode.tikz()}` : "";
        result += ` to${d.tikz()}${edgeNode} ${d.targetRef}`;
      }
      result += ";\n";
    }
    result += "\t\\end{pgfonlayer}\n";
    result += "\\end{tikzpicture}\n";
    return result;
  }
}

export default Graph;
