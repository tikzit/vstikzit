import * as assert from "assert";
import { parseTikzPicture, parseTikzStyles } from "../data/TikzParser";

function strip(input: string): string {
  return input
    .split("\n")
    .map(line => line.trim())
    .filter(line => line !== "")
    .join("\n");
}

describe("Graph parser", () => {
  it("should parse a simple graph", () => {
    const input = `
    \\begin{tikzpicture}
    \\begin{pgfonlayer}{nodelayer}
    \\node[style=Z] (0) at (1, 2) {A};
    \\end{pgfonlayer}
    \\begin{pgfonlayer}{edgelayer}
    \\end{pgfonlayer}
    \\end{tikzpicture}`;
    const parsed = parseTikzPicture(input);
    assert.notStrictEqual(parsed.result, undefined);
    const g = parsed.result!;
    assert.strictEqual(g.nodeData.size, 1);
    assert.strictEqual(g.nodeData.get(0)?.property("style"), "Z");
    assert.strictEqual(strip(g.tikz()), strip(input));
  });

  it("should parse a graph twice and preserve unchanged data", () => {
    const input1 = `
    \\begin{tikzpicture}
    \\node[style=A] (0) at (0, 0) {};
    \\node[style=B1] (1) at (0, 0) {};
    \\node[style=C] (2) at (0, 0) {};
    \\node[style=D] (3) at (0, 0) {};
    \\end{tikzpicture}`;
    const parsed1 = parseTikzPicture(input1);
    assert.notStrictEqual(parsed1.result, undefined);

    const input2 = `
    \\begin{tikzpicture}
    \\node[style=A] (0) at (0, 0) {};
    \\node[style=B2] (1) at (0, 0) {};
    \\node[style=C] (2) at (0, 0) {};
    \\node[style=D] (3) at (0, 0) {};
    \\end{tikzpicture}`;
    const parsed2 = parseTikzPicture(input2);
    assert.notStrictEqual(parsed2.result, undefined);

    const g1 = parsed1.result!;

    const g2 = parsed2.result!;
    assert.notStrictEqual(g1.nodeData.get(0), g2.nodeData.get(0), "g1[0] ? g2[0]");
    assert.notStrictEqual(g1.nodeData.get(1), g2.nodeData.get(1), "g1[1] ? g2[1]");
    assert.notStrictEqual(g1.nodeData.get(2), g2.nodeData.get(2), "g1[2] ? g2[2]");
    assert.notStrictEqual(g1.nodeData.get(3), g2.nodeData.get(3), "g1[3] ? g2[3]");

    const g3 = g2.inheritDataFrom(g1);
    assert.strictEqual(g1.nodeData.get(0), g3.nodeData.get(0), "g1[0] ? g3[0]");
    assert.notStrictEqual(g1.nodeData.get(1), g3.nodeData.get(1), "g1[1] ? g3[1]");
    assert.strictEqual(g1.nodeData.get(2), g3.nodeData.get(2), "g1[2] ? g3[2]");
    assert.strictEqual(g1.nodeData.get(3), g3.nodeData.get(3), "g1[3] ? g3[3]");
  });
});

describe("Tikzstyles parser", () => {
  it("should parse a single tikz style", () => {
    const input = "\\tikzstyle{myStyle}=[color=blue]";
    const parsed = parseTikzStyles(input);
    assert.notStrictEqual(parsed.result, undefined);
  });
});
