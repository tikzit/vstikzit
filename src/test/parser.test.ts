import * as assert from "assert";
import { parseTikzStyles } from "../data/TikzParser";

describe("Tikzstyles parser", () => {
  it("should parse a single tikz style", () => {
    const input = "\\tikzstyle{myStyle}=[color=blue]";
    const parsed = parseTikzStyles(input);

    assert.notStrictEqual(parsed.result, undefined);
  });
});
