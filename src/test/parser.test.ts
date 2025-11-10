import { assert } from "chai";
import { parseTikzPicture, parseTikzStyles } from "../lib/TikzParser";

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
    \\node [style=Z] (0) at (1, 2) {A};
    \\end{pgfonlayer}
    \\begin{pgfonlayer}{edgelayer}
    \\end{pgfonlayer}
    \\end{tikzpicture}`;
    const parsed = parseTikzPicture(input);

    if (parsed.errors.length > 0) {
      console.error("Parsing errors found:");
      parsed.errors.forEach(error => {
        console.error(`${error.line}(${error.column}): ${error.message}`);
      });
    }
    assert.notStrictEqual(parsed.result, undefined);
    const g = parsed.result!;
    assert.strictEqual(g.numNodes, 1);
    assert.strictEqual(g.node(0)?.property("style"), "Z");
    assert.strictEqual(strip(g.tikz()), strip(input));
  });

  it("should parse a graph with multiple nodes and edges", () => {
    const input = `
    \\begin{tikzpicture}
    \\begin{pgfonlayer}{nodelayer}
    \\node [style=A, complex style={{foo} {bar\\\\} {baz=$\\{$}}] (0) at (0, 0) {a};
    \\node [style=B] (1) at (1, 0) {b};
    \\node [style=C] (2) at (2, 0) {c};
    \\node [style=D] (3) at (3, 0) {d};
    \\end{pgfonlayer}
    \\begin{pgfonlayer}{edgelayer}
    \\draw (0) to (1);
    \\draw (1) to (2) to (3);
    \\end{pgfonlayer}
    \\end{tikzpicture}`;
    const parsed = parseTikzPicture(input);
    if (parsed.errors.length > 0) {
      console.error("Parsing errors found:");
      parsed.errors.forEach(error => {
        console.error(`${error.line}(${error.column}): ${error.message}`);
      });
    }
    assert.notStrictEqual(parsed.result, undefined);
    const g = parsed.result!;
    assert.strictEqual(g.numNodes, 4);
    assert.strictEqual(g.numEdges, 3);
    assert.strictEqual(g.numPaths, 2);
    assert.strictEqual(g.node(0)?.property("style"), "A");
    assert.strictEqual(g.node(0)?.property("complex style"), "{foo} {bar\\\\} {baz=$\\{$}");
    assert.strictEqual(g.node(1)?.property("style"), "B");
    assert.strictEqual(g.node(2)?.property("style"), "C");
    assert.strictEqual(g.node(3)?.property("style"), "D");
    assert.strictEqual(g.edge(0)?.sourceId, 0);
    assert.strictEqual(g.edge(0)?.targetId, 1);
    assert.strictEqual(g.edge(1)?.sourceId, 1);
    assert.strictEqual(g.edge(1)?.targetId, 2);
    assert.strictEqual(g.edge(2)?.sourceId, 2);
    assert.strictEqual(g.edge(2)?.targetId, 3);
    assert.strictEqual(g.path(0)?.edges.length, 1);
    assert.strictEqual(g.path(1)?.edges.length, 2);
    assert.strictEqual(strip(g.tikz()), strip(input));
  });

  it("should parse a graph twice and preserve unchanged data", () => {
    const input1 = `
    \\begin{tikzpicture}
    \\node [style=A] (0) at (0, 0) {};
    \\node [style=B] (1) at (0, 0) {};
    \\node [style=C] (2) at (0, 0) {};
    \\node [style=D] (3) at (0, 0) {};
    \\end{tikzpicture}`;
    const parsed1 = parseTikzPicture(input1);
    assert.notStrictEqual(parsed1.result, undefined);

    const input2 = `
    \\begin{tikzpicture}
    \\node [style=A] (0) at (0, 0) {};
    \\node [style=B2] (1) at (0, 0) {};
    \\node [style=C] (2) at (0, 0) {};
    \\node [style=D] (3) at (0, 0) {};
    \\end{tikzpicture}`;
    const parsed2 = parseTikzPicture(input2);
    assert.notStrictEqual(parsed2.result, undefined);

    const g1 = parsed1.result!;

    const g2 = parsed2.result!;
    assert.notStrictEqual(g1.node(0), g2.node(0), "g1[0] ? g2[0]");
    assert.notStrictEqual(g1.node(1), g2.node(1), "g1[1] ? g2[1]");
    assert.notStrictEqual(g1.node(2), g2.node(2), "g1[2] ? g2[2]");
    assert.notStrictEqual(g1.node(3), g2.node(3), "g1[3] ? g2[3]");

    g2.inheritDataFrom(g1);
    assert.strictEqual(g1.node(0), g2.node(0), "g1[0] ? g3[0]");
    assert.notStrictEqual(g1.node(1), g2.node(1), "g1[1] ? g3[1]");
    assert.strictEqual(g1.node(2), g2.node(2), "g1[2] ? g3[2]");
    assert.strictEqual(g1.node(3), g2.node(3), "g1[3] ? g3[3]");
  });
});

describe("Tikzstyles parser", () => {
  it("should parse a single tikz style", () => {
    const input = "\\tikzstyle{myStyle}=[color=blue]";
    const parsed = parseTikzStyles(input);
    assert.notStrictEqual(parsed.result, undefined);
    const styles = parsed.result!;
    assert.strictEqual(strip(styles.tikz()), strip(input));
  });

  it("should parse several node and edge styles", () => {
    const input = `
    \\tikzstyle{gate}=[shape=rectangle, text height=1.5ex, text depth=0.25ex, fill=white, draw=black, minimum height=5mm, yshift=-0.5mm, minimum width=5mm, font={\\small}, tikzit category=circuit]
    \\tikzstyle{big gate}=[shape=rectangle, text height=1.5ex, text depth=0.25ex, fill=white, draw=black, minimum height=10mm, yshift=-0.5mm, minimum width=5mm, font={\\small}, tikzit category=circuit]
    \\tikzstyle{Z dot}=[inner sep=0mm, minimum size=2mm, shape=circle, draw=black, fill=zxgreen, tikzit fill={rgb,255: red,221; green,255; blue,221}, tikzit category=zx]
    \\tikzstyle{Z bold dot}=[inner sep=0mm, minimum size=2mm, shape=circle, draw=black, fill=zxgreen, tikzit fill={rgb,255: red,221; green,255; blue,221}, line width=1.2pt, tikzit category=zx]
    \\tikzstyle{Z phase dot}=[minimum size=5mm, font={\\footnotesize\\boldmath}, shape=rectangle, rounded corners=2mm, inner sep=0.2mm, outer sep=-2mm, scale=0.8, tikzit shape=circle, draw=black, fill=zxgreen, tikzit fill={rgb,255: red,221; green,255; blue,221}, tikzit draw=blue, tikzit category=zx]
    \\tikzstyle{simple}=[-]
    \\tikzstyle{hadamard edge}=[-, dashed, dash pattern=on 2pt off 0.5pt, thick, draw={rgb,255: red,68; green,136; blue,255}]
    \\tikzstyle{box edge}=[-, dashed, dash pattern=on 2pt off 0.5pt, thick, draw={rgb,255: red,203; green,192; blue,225}]
    \\tikzstyle{brace edge}=[-, tikzit draw=blue, decorate, decoration={brace,amplitude=1mm,raise=-1mm}]
    `;
    const parsed = parseTikzStyles(input);
    assert.notStrictEqual(parsed.result, undefined);
    const styles = parsed.result!;
    // TODO: fix this. It currently doesn't output the spacing of numbers with unit of measure correctly.
    assert.strictEqual(strip(styles.tikz()), strip(input));
  });

  it("should parse a tikz style with xcolor mix", () => {
    const input = `\\tikzstyle{dot}=[fill=black!10, draw=red!30!blue]`;
    const parsed = parseTikzStyles(input);
    if (parsed.errors.length > 0) {
      console.error("Parsing errors found:");
      parsed.errors.forEach(error => {
        console.error(`${error.line}(${error.column}): ${error.message}`);
      });
    }
    assert.notStrictEqual(parsed.result, undefined);
    const styles = parsed.result!;
    assert.strictEqual(strip(styles.tikz()), strip(input));
  });
});

