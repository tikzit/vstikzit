import { assert } from "chai";
import { NodeData, Coord, mapEquals } from "../lib/Data";

describe("NodeData", () => {
  it("should create a NodeData instance", () => {
    const node = new NodeData();
    assert.notStrictEqual(node, undefined);
  });

  it("should set and get properties", () => {
    const node = new NodeData().setLabel("Label").setCoord(new Coord(1, 2));
    assert.strictEqual(node.label, "Label");
    assert.deepStrictEqual(node.coord, new Coord(1, 2));
  });

  it("should be equal for identical nodes", () => {
    const node1 = new NodeData().setLabel("Label").setCoord(new Coord(1, 2));
    const node2 = new NodeData().setLabel("Label").setCoord(new Coord(1, 2));
    assert.notStrictEqual(node1, node2);
    assert.ok(node1.equals(node2));
  });

  it("should give correct map equality", () => {
    const node1 = new NodeData().setLabel("Label").setCoord(new Coord(1, 2));
    const node2 = new NodeData().setLabel("Label").setCoord(new Coord(1, 2));
    const container1 = new Map<string, NodeData>().set("node1", node1);
    const container2 = new Map<string, NodeData>().set("node1", node2);
    assert.ok(mapEquals(container1, container2));
  });
});
