import { NodeData, EdgeData, PathData, GraphData, mapEquals } from "./Data";

class Graph {
  private _graphData: GraphData = new GraphData();
  private _nodeData: Map<number, NodeData>;
  private _pathData: Map<number, PathData>;
  private _edgeData: Map<number, EdgeData>;
  private maxNodeId: number;
  private maxEdgeId: number;
  private maxPathId: number;

  constructor(graph?: Graph) {
    this._graphData = graph?._graphData ?? new GraphData();
    this._nodeData = graph !== undefined ? new Map(graph._nodeData) : new Map();
    this._edgeData = graph !== undefined ? new Map(graph._edgeData) : new Map();
    this._pathData = graph !== undefined ? new Map(graph._pathData) : new Map();
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

  public get nodeData(): Map<number, NodeData> {
    return this._nodeData;
  }

  public get edgeData(): Map<number, EdgeData> {
    return this._edgeData;
  }

  public get pathData(): Map<number, PathData> {
    return this._pathData;
  }

  public get nodes(): number[] {
    return Array.from(this._nodeData.keys());
  }

  public get paths(): number[] {
    return Array.from(this._pathData.keys());
  }

  public get edges(): number[] {
    return Array.from(this._edgeData.keys());
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
    g._nodeData.set(d.id, d);
    if (d.id > g.maxNodeId) {
      g.maxNodeId = d.id;
    }
    return g;
  }

  public addEdgeWithData(d: EdgeData): Graph {
    const g = this.copy();
    g._edgeData.set(d.id, d);
    if (d.id > g.maxEdgeId) {
      g.maxEdgeId = d.id;
    }
    return g;
  }

  public addPathWithData(d: PathData): Graph {
    const g = this.copy();
    g._pathData.set(d.id, d);
    if (d.id > g.maxPathId) {
      g.maxPathId = d.id;
    }
    return g;
  }

  public updateNodeData(id: number, fn: (data: NodeData) => NodeData): Graph {
    const node = this._nodeData.get(id);
    if (node) {
      const g = this.copy();
      g._nodeData.set(id, fn(node));
      return g;
    } else {
      return this;
    }
  }

  public setNodeData(id: number, data: NodeData): Graph {
    const g = this.copy();
    g._nodeData.set(id, data);
    return g;
  }

  public mapNodeData(fn: (data: NodeData) => NodeData): Graph {
    const g = this.copy();
    const keys = Array.from(g._nodeData.keys());
    for (const key of keys) {
      g._nodeData.set(key, fn(g._nodeData.get(key)!));
    }
    return g;
  }

  public updateEdgeData(id: number, fn: (data: EdgeData) => EdgeData): Graph {
    const edge = this._edgeData.get(id);
    if (edge) {
      const g = this.copy();
      g._edgeData.set(id, fn(edge));
      return g;
    } else {
      return this;
    }
  }

  public setEdgeData(id: number, data: EdgeData): Graph {
    const g = this.copy();
    g._edgeData.set(id, data);
    return g;
  }

  public mapEdgeData(fn: (data: EdgeData) => EdgeData): Graph {
    const g = this.copy();
    const keys = Array.from(g._edgeData.keys());
    for (const key of keys) {
      g._edgeData.set(key, fn(g._edgeData.get(key)!));
    }
    return g;
  }

  public updatePathData(id: number, fn: (data: PathData) => PathData): Graph {
    const path = this._pathData.get(id);
    if (path) {
      const g = this.copy();
      g._pathData.set(id, fn(path));
      return g;
    } else {
      return this;
    }
  }

  public setPathData(id: number, data: PathData): Graph {
    const g = this.copy();
    g._pathData.set(id, data);
    return g;
  }

  public edgeSourceData(id: number): NodeData | undefined {
    const edge = this._edgeData.get(id);
    if (edge) {
      return this._nodeData.get(edge.source);
    } else {
      return undefined;
    }
  }

  public edgeTargetData(id: number): NodeData | undefined {
    const edge = this._edgeData.get(id);
    if (edge) {
      return this._nodeData.get(edge.target);
    } else {
      return undefined;
    }
  }

  public pathSource(id: number): number {
    const edge = this._edgeData.get(this._pathData.get(id)!.edges[0])!;
    return edge.source;
  }

  public pathTarget(id: number): number {
    const edge = this._edgeData.get(this._pathData.get(id)!.edges[this._pathData.get(id)!.edges.length - 1])!;
    return edge.target;
  }

  public removeNodes(nodes: Iterable<number>): Graph {
    const g = this.copy();
    const nodeSet = new Set(nodes);
    for (const n of nodeSet) {
      g._nodeData.delete(n);
    }

    for (const ed of g._edgeData.values()) {
      if (nodeSet.has(ed.source) || nodeSet.has(ed.target)) {
        g._edgeData.delete(ed.id);
      }
    }

    return g.removeDanglingPaths();
  }

  public removeEdges(edges: Iterable<number>): Graph {
    const g = this.copy();
    const remove = Array.from(edges);
    for (const e of remove) {
      g._edgeData.delete(e);
    }
    return g.removeDanglingPaths();
  }

  public removePath(pathId: number): Graph {
    const g = this.copy();
    g._pathData.delete(pathId);
    return g;
  }

  // after removing edges, cut paths into multiple pieces where edges are missing
  // and remove any empty paths
  private removeDanglingPaths(): Graph {
    let g = this.copy();
    const paths = Array.from(g._pathData.values());

    for (const pd of paths) {
      let edges: number[] = [];
      let newPath = false;
      for (const e of pd.edges) {
        if (g._edgeData.has(e)) {
          edges.push(e);
        } else {
          if (edges.length > 0) {
            if (!newPath) {
              g = g.updatePathData(pd.id, p => p.setEdges(edges));
            } else {
              const pathId = g.freshPathId;
              g = g.addPathWithData(new PathData().setId(pathId).setEdges(edges));
              edges.forEach(e => {
                g = g.updateEdgeData(e, ed => ed.setPath(pathId));
              });
            }
            newPath = true;
            edges = [];
          }
        }
      }

      if (edges.length > 0) {
        if (!newPath) {
          g = g.updatePathData(pd.id, p => p.setEdges(edges));
        } else {
          const pathId = g.freshPathId;
          g = g.addPathWithData(new PathData().setId(pathId).setEdges(edges));
          edges.forEach(e => {
            g = g.updateEdgeData(e, ed => ed.setPath(pathId));
          });
        }
        newPath = true;
      }

      if (!newPath) {
        g = g.removePath(pd.id);
      }
    }
    return g;
  }

  // reverse the direction of a path
  public reversePath(pathId: number): Graph {
    let graph = this.copy();
    const pd = this._pathData.get(pathId)!;
    graph.updatePathData(pathId, p => p.setEdges(pd.edges.reverse()));
    for (const e of pd.edges) {
      graph = graph.updateEdgeData(e, ed => ed.reverse());
    }
    return graph;
  }

  // splits a path with N edges into N paths with 1 edge each
  public splitPath(pathId: number): Graph {
    let graph = this.copy();
    const pd = this._pathData.get(pathId)!;

    if (pd.edges.length > 1) {
      graph = graph.updatePathData(pathId, p => p.setEdges(pd.edges.slice(0, 1)).setIsCycle(false));
      for (const e of pd.edges.slice(1)) {
        const newPathId = graph.freshPathId;
        graph = graph.addPathWithData(new PathData().setId(newPathId).setEdges([e]));
        graph = graph.updateEdgeData(e, ed => ed.setPath(newPathId));
      }
    }

    return graph;
  }

  // join two paths that connect, reversing one of the paths if necessary
  // Returns undefined if the paths cannot be joined and always preserves the first path ID
  private joinTwoPaths(path1: number, path2: number): Graph | undefined {
    let graph = this.copy();
    const pd1 = this._pathData.get(path1);
    const pd2 = this._pathData.get(path2);

    if (pd1 === undefined || pd2 === undefined) {
      return undefined;
    }

    // there are four cases. Depending on how the paths connect, we may need to reverse
    // path2 then either prepend or append its edges to path1

    if (this.pathTarget(path1) === this.pathSource(path2)) {
      // I join two paths in the morning
      graph = graph.updatePathData(path1, p => p.setEdges(pd1.edges.concat(pd2.edges)));
    } else if (this.pathSource(path1) === this.pathTarget(path2)) {
      // I join two paths at night
      graph = graph.updatePathData(path1, p => p.setEdges(pd2.edges.concat(pd1.edges)));
    } else if (this.pathTarget(path1) === this.pathTarget(path2)) {
      // I join two paths in the afternoon
      graph = graph.reversePath(path2);
      graph = graph.updatePathData(path1, p => p.setEdges(pd1.edges.concat(pd2.edges)));
    } else if (this.pathSource(path1) === this.pathSource(path2)) {
      // It makes me feel alright
      graph = graph.reversePath(path2);
      graph = graph.updatePathData(path1, p => p.setEdges(pd2.edges.concat(pd1.edges)));
    } else {
      return undefined;
    }

    graph = graph.removePath(path2);
    for (const e of pd2.edges) {
      graph = graph.updateEdgeData(e, ed => ed.setPath(path1));
    }

    return graph;
  }

  // attempt to join a collection of paths into a single path, reversing paths if necessary
  public joinPaths(paths: Iterable<number>): Graph {
    let graph = this.copy();

    let otherPaths = Array.from(paths);
    if (otherPaths.length === 0) {
      return this;
    }
    const path = otherPaths[0];
    otherPaths = otherPaths.slice(1);

    while (otherPaths.length > 0) {
      const p = otherPaths.find(p => {
        const g = graph.joinTwoPaths(path, p);
        if (g !== undefined) {
          graph = g;
          return true;
        } else {
          return false;
        }
      });

      if (p !== undefined) {
        otherPaths = otherPaths.filter(q => q !== p);
      } else {
        return this;
      }
    }

    if (graph.pathSource(path) === graph.pathTarget(path)) {
      graph = graph.updatePathData(path, p => p.setIsCycle(true));
    }
    return graph;
  }

  public subgraphFromNodes(nodes: Iterable<number>): Graph {
    const nodeSet = new Set(nodes);
    const nodeComp = this.nodes.filter(key => !nodeSet.has(key));
    return this.removeNodes(nodeComp);
  }

  // insert the other graph, setting fresh IDs where necessary
  public insertGraph(other: Graph): Graph {
    let g = this.copy();
    const ntab: { [key: number]: number } = {};
    const etab: { [key: number]: number } = {};
    const ptab: { [key: number]: number } = {};

    for (const [id, data] of other._nodeData) {
      ntab[id] = g._nodeData.has(id) ? g.freshNodeId : id;
      g = g.addNodeWithData(data.setId(ntab[id]));
    }

    for (const [id, data] of other._edgeData) {
      etab[id] = g._edgeData.has(id) ? g.freshEdgeId : id;
      const d = data.setId(etab[id]).setSource(ntab[data.source]).setTarget(ntab[data.target]);
      g = g.addEdgeWithData(d);
    }

    for (const [id, data] of other._pathData) {
      ptab[id] = g._pathData.has(id) ? g.freshPathId : id;
      const d = data.setId(ptab[id]).setEdges(data.edges.map(e => etab[e]));
      g = g.addPathWithData(d);
    }

    g = g.mapEdgeData(d => (!this._edgeData.has(d.id) ? d.setPath(ptab[d.path]) : d));

    return g;
  }

  // shift all nodes by the given offsets
  public shiftGraph(dx: number, dy: number): Graph {
    return this.mapNodeData(d => d.setCoord(d.coord.shift(dx, dy)));
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
    let keys = Array.from(this._nodeData.keys());
    for (const key of keys) {
      const d = other._nodeData.get(key)!;
      if (this._nodeData.get(key)?.equals(d)) {
        g._nodeData.set(key, d);
      }
    }

    keys = Array.from(this._edgeData.keys());
    for (const key of keys) {
      const d = other._edgeData.get(key)!;
      if (this._edgeData.get(key)?.equals(d)) {
        g._edgeData.set(key, d);
      }
    }

    keys = Array.from(this._pathData.keys());
    for (const key of keys) {
      const d = other._pathData.get(key)!;
      if (this._pathData.get(key)?.equals(d)) {
        g._pathData.set(key, d);
      }
    }

    return g;
  }

  public equals(other: Graph): boolean {
    return (
      mapEquals(this._nodeData, other._nodeData) &&
      mapEquals(this._edgeData, other._edgeData) &&
      mapEquals(this._pathData, other._pathData) &&
      this.maxNodeId === other.maxNodeId &&
      this.maxEdgeId === other.maxEdgeId &&
      this.maxPathId === other.maxPathId
    );
  }

  public tikzWithPosition(
    node?: number,
    edge?: number
  ): [string, { line: number; column: number } | undefined] {
    let position: { line: number; column: number } | undefined = undefined;

    let result = "\\begin{tikzpicture}\n";
    result += "\t\\begin{pgfonlayer}{nodelayer}\n";
    for (const d of this.nodeData.values()) {
      if (d) {
        const dt = d.tikz();
        result += "\t\t\\node " + dt;

        if (node === d.id) {
          // return the position of the end of the property list
          const lines = result.split("\n");
          position = { line: lines.length - 1, column: lines[lines.length - 1].length - 1 };
        }

        if (dt !== "") {
          result += " ";
        }

        result += `(${d.id}) at (${d.coord.x}, ${d.coord.y}) {${d.label}};\n`;
      }
    }
    result += "\t\\end{pgfonlayer}\n";
    result += "\t\\begin{pgfonlayer}{edgelayer}\n";
    for (const pd of this.pathData.values()) {
      let d = this.edgeData.get(pd.edges[0])!;
      const dt = d.tikz();
      result += `\t\t\\draw ${dt}`;

      if (edge !== undefined && pd.edges.find(e => e === edge)) {
        // return the position of the end of the edge property list
        const lines = result.split("\n");
        position = { line: lines.length - 1, column: lines[lines.length - 1].length - 1 };
      }

      if (dt !== "") {
        result += " ";
      }

      let edgeNode = d.edgeNode !== undefined ? ` node${d.edgeNode.tikz()}` : "";
      result += `${d.sourceRef} to${edgeNode} ${d.targetRef}`;

      for (const edgeId of pd.edges.slice(1)) {
        d = this.edgeData.get(edgeId)!;
        edgeNode = d.edgeNode !== undefined ? ` node${d.edgeNode.tikz()}` : "";
        result += ` to${d.tikz()}${edgeNode} ${d.targetRef}`;
      }
      result += ";\n";
    }
    result += "\t\\end{pgfonlayer}\n";
    result += "\\end{tikzpicture}\n";
    return [result, position];
  }

  public tikz(): string {
    return this.tikzWithPosition()[0];
  }
}

export default Graph;
