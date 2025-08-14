import { NodeData, EdgeData } from "./Data";

class Graph {
  public nodes: number[];
  public edges: number[];
  public nodeData: Map<number, NodeData>;
  public edgeData: Map<number, EdgeData>;
  private maxNodeId = -1;
  private maxEdgeId = -1;

  constructor() {
    this.nodes = [];
    this.edges = [];
    this.nodeData = new Map<number, NodeData>();
    this.edgeData = new Map<number, EdgeData>();
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

  public freshNodeId(): number {
    return this.maxNodeId + 1;
  }

  public freshEdgeId(): number {
    return this.maxEdgeId + 1;
  }
}

export default Graph;
