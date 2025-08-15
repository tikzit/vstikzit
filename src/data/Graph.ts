import { NodeData, EdgeData, PathData, Data } from "./Data";

class Graph {
  public nodes: number[];
  public paths: number[];
  public graphData: Data = new Data(0);
  public nodeData: Map<number, NodeData>;
  public pathData: Map<number, PathData>;
  public edgeData: Map<number, EdgeData>;
  private maxNodeId = -1;
  private maxEdgeId = -1;
  private maxPathId = -1;

  constructor() {
    this.nodes = [];
    this.paths = [];
    this.nodeData = new Map<number, NodeData>();
    this.edgeData = new Map<number, EdgeData>();
    this.pathData = new Map<number, PathData>();
  }

  public addNodeWithData(d: NodeData): void {
    this.nodes.push(d.id);
    this.nodeData.set(d.id, d);
    if (d.id > this.maxNodeId) {
      this.maxNodeId = d.id;
    }
  }

  public addEdgeWithData(d: EdgeData): void {
    this.edgeData.set(d.id, d);
    if (d.id > this.maxEdgeId) {
      this.maxEdgeId = d.id;
    }
  }

  public addPathWithData(d: PathData): void {
    this.paths.push(d.id);
    this.pathData.set(d.id, d);
    if (d.id > this.maxPathId) {
      this.maxPathId = d.id;
    }
  }

  public freshNodeId(): number {
    return this.maxNodeId + 1;
  }

  public freshEdgeId(): number {
    return this.maxEdgeId + 1;
  }

  public freshPathId(): number {
    return this.maxPathId + 1;
  }

  public tikz(): string {
    let result = "\\begin{tikzpicture}\n";
    result += "\t\\begin{pgfonlayer}{nodelayer}\n";
    for (const n of this.nodes) {
      const d = this.nodeData.get(n);
      if (d) {
        result += `\t\t\\node${d.tikz()} (${d.id}) at (${d.coord[0]}, ${d.coord[1]}) {${d.label}};\n`;
      }
    }
    result += "\t\\end{pgfonlayer}\n";
    result += "\\end{tikzpicture}\n";
    return result;
  }
}

export default Graph;
