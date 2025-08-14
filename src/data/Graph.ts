class Data {
    public id: number;
    private pairs: [string, string | null][];

    constructor(id: number) {
        this.id = id;
        this.pairs = [];
    }

    public setProperty(key: string, value: string): void {
        const i = this.pairs.findIndex(pair => pair[0] === key);
        if (i !== -1) {
            this.pairs[i][1] = value;
        } else {
            this.pairs.push([key, value]);
        }
    }

    public setAtom(key: string): void {
        const i = this.pairs.findIndex(pair => pair[0] === key);
        if (i === -1) {
            this.pairs.push([key, null]);
        }
    }

    public unsetAtom(key: string): void {
        const i = this.pairs.findIndex(pair => pair[0] === key);
        if (i !== -1) {
            this.pairs.splice(i, 1);
        }
    }

    public property(key: string): string | null {
        const pair = this.pairs.find(pair => pair[0] === key);
        return pair ? pair[1] : null;
    }

    public atom(key: string): boolean {
        const i = this.pairs.findIndex(pair => pair[0] === key);
        return (i !== -1);
    }
}

class NodeData extends Data {
    public inEdges: string[];
    public outEdges: string[];

    constructor(id: number) {
        super(id);
        this.inEdges = [];
        this.outEdges = [];
    }
}

class EdgeData extends Data {
    public source: number;
    public target: number;

    constructor(id: number, source: number, target: number) {
        super(id);
        this.source = source;
        this.target = target;
    }
}

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
export { NodeData, EdgeData, Data };