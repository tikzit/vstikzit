type Coord = [number, number];

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
        return i !== -1;
    }
}

class NodeData extends Data {
    public inEdges: string[] = [];
    public outEdges: string[] = [];
    public coord: Coord = [0, 0];
    public label: string = "";
    public labelStart?: number;
    public labelEnd?: number;
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

class StyleData extends Data {
    public name: string = "";
}

export { Data, NodeData, EdgeData, StyleData, Coord };
