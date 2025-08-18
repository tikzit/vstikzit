import { OrderedMap, Seq } from "immutable";
import { NodeData, EdgeData, PathData, GraphData } from "./Data";

class Graph {
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

  public get freshNodeId(): number {
    return this.maxNodeId + 1;
  }

  public get freshEdgeId(): number {
    return this.maxEdgeId + 1;
  }

  public get freshPathId(): number {
    return this.maxPathId + 1;
  }

  public tikz(): string {
    let result = "\\begin{tikzpicture}\n";
    result += "\t\\begin{pgfonlayer}{nodelayer}\n";
    for (const d of this.nodeData.values()) {
      if (d) {
        result += `\t\t\\node${d.tikz()} (${d.id}) at (${d.coord[0]}, ${d.coord[1]}) {${
          d.label
        }};\n`;
      }
    }
    result += "\t\\end{pgfonlayer}\n";
    result += "\t\\begin{pgfonlayer}{edgelayer}\n";
    for (const pd of this.pathData.values()) {
      let d = this.edgeData.get(pd.edges.get(0)!)!;
      let edgeNode = d.edgeNode !== undefined ? ` node${d.edgeNode.tikz()}` : "";
      result += `\t\t\\draw${d.tikz()} ${d.sourceRef} to${edgeNode} ${d.targetRef}`;

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
