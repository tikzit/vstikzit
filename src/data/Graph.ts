import { NodeData, EdgeData, PathData } from "./Data";

class Graph {
  public nodes: number[];
  public edges: number[];
  public paths: number[];
  public nodeData: Map<number, NodeData>;
  public edgeData: Map<number, EdgeData>;
  public pathData: Map<number, PathData>;
  private maxNodeId = -1;
  private maxEdgeId = -1;
  private maxPathId = -1;

  constructor() {
    this.nodes = [];
    this.edges = [];
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
    this.edges.push(d.id);
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
}

export default Graph;
