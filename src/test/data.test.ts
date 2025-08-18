import * as assert from "assert";
import { NodeData } from "../data/Data";

describe("NodeData", () => {
  it("should create a NodeData instance", () => {
    const node = new NodeData();
    assert.notStrictEqual(node, undefined);
  });

  it("should set and get properties", () => {
    let node = new NodeData();
    node = node.setLabel("Label").setCoord([1, 2]);
    assert.strictEqual(node.label, "Label");
    assert.deepStrictEqual(node.coord, [1, 2]);
  });
});
