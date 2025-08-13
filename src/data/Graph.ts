class Data {
    private pairs: [string, string | null][];

    constructor() {
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

class Node {
    public name: string;
    public inEdges: Edge[];
    public outEdges: Edge[];
    public data: Data;

    constructor(name: string) {
        this.name = name;
        this.inEdges = [];
        this.outEdges = [];
        this.data = new Data();
    }
}

class Edge {
    public source: Node;
    public target: Node;
    public data: Data;

    constructor(source: Node, target: Node) {
        this.source = source;
        this.target = target;
        this.source.inEdges.push(this);
        this.target.outEdges.push(this);
        this.data = new Data();
    }
}

class Graph {
    public nodes: Node[];
    public edges: Edge[];

    constructor() {
        this.nodes = [];
        this.edges = [];
    }

    public addNode(name: string): Node {
        const newNode = new Node(name);
        this.nodes.push(newNode);
        return newNode;
    }

    public getNode(name: string): Node | null {
        return this.nodes.find(node => node.name === name) || null;
    }

    public addEdge(sourceName: string, targetName: string): Edge | null {
        const source = this.getNode(sourceName);
        const target = this.getNode(targetName);
        if (!source || !target) { return null; }
        const newEdge = new Edge(source, target);
        this.edges.push(newEdge);
        return newEdge;
    }
}

export default Graph;
export { Node, Edge, Data };