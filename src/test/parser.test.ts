import * as assert from "assert";
import { parseTikzPicture, parseTikzStyles } from "../data/TikzParser";

describe("Graph parser", () => {
  it("should parse a simple graph", () => {
    const input = "\\begin{tikzpicture} \\node[style=Z] (0) at (1,2) {A}; \\end{tikzpicture}";
    const parsed = parseTikzPicture(input);
    assert.notStrictEqual(parsed.result, undefined);
  });
});

describe("Tikzstyles parser", () => {
  it("should parse a single tikz style", () => {
    const input = "\\tikzstyle{myStyle}=[color=blue]";
    const parsed = parseTikzStyles(input);
    assert.notStrictEqual(parsed.result, undefined);
  });
});
