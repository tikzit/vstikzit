import * as assert from "assert";
import { parseTikzStyles } from "../data/TikzParser";

describe("Sample Test", () => {
  it("should return true for valid input", () => {
    assert.strictEqual(true, true);
  });
});

describe("Tikzstyles parser", () => {
  it("should parse a single tikz style", () => {
    const input = "\\tikzstyle{myStyle}=[color=blue]";
    const parsed = parseTikzStyles(input);

    assert.notStrictEqual(parsed.result, undefined);
  });
});
