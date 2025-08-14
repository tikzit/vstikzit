import { NodeData, EdgeData } from './Data';

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

    public addNode(id: number): void {
        const newNode = new NodeData(id);
        this.nodes.push(id);
        this.nodeData.set(id, newNode);
        if (id > this.maxNodeId) {
            this.maxNodeId = id;
        }
    }

    public freshNodeId(): number {
        return this.maxNodeId + 1;
    }

    public addEdge(source: number, target: number): number {
        this.maxEdgeId++;
        const id = this.maxEdgeId;
        const d = new EdgeData(id, source, target);
        this.edges.push(id);
        this.edgeData.set(id, d);
        return id;
    }
}

export default Graph;