import * as assert from "assert";
import { parseTikzStyles } from "../data/TikzParser";

suite("Parser tests", () => {
  test("Parse single tikzstyle", () => {
    const input = "\\tikzstyle{mystyle}=[circle, draw, fill=red]";
    const result = parseTikzStyles(input);
    assert.notStrictEqual(result.result, undefined);
  });
});
