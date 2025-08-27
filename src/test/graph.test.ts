import * as assert from "assert";
import { List } from "immutable";
import Graph from "../lib/Graph";
import { NodeData, EdgeData, PathData, Coord } from "../lib/Data";

describe("Graph", () => {
  describe("Node operations", () => {
    it("should create an empty graph", () => {
      const graph = new Graph();
      assert.strictEqual(graph.numNodes, 0);
      assert.strictEqual(graph.numEdges, 0);
      assert.strictEqual(graph.numPaths, 0);
    });

    it("should add a node with data", () => {
      const graph = new Graph();
      const nodeData = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(1, 2));

      const newGraph = graph.addNodeWithData(nodeData);

      // Original graph should be unchanged (immutable)
      assert.strictEqual(graph.numNodes, 0);

      // New graph should contain the node
      assert.strictEqual(newGraph.numNodes, 1);
      assert.ok(newGraph.nodeData.has(1));
      assert.strictEqual(newGraph.nodeData.get(1)?.label, "Node 1");
      assert.deepStrictEqual(newGraph.nodeData.get(1)?.coord, new Coord(1, 2));
    });

    it("should add multiple nodes", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));

      const newGraph = graph.addNodeWithData(node1).addNodeWithData(node2);

      assert.strictEqual(newGraph.numNodes, 2);
      assert.ok(newGraph.nodeData.has(1));
      assert.ok(newGraph.nodeData.has(2));
      assert.strictEqual(newGraph.nodeData.get(1)?.label, "Node 1");
      assert.strictEqual(newGraph.nodeData.get(2)?.label, "Node 2");
    });

    it("should remove a single node", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));

      const graphWithNodes = graph.addNodeWithData(node1).addNodeWithData(node2);

      const graphAfterRemoval = graphWithNodes.removeNodes([1]);

      assert.strictEqual(graphAfterRemoval.numNodes, 1);
      assert.ok(!graphAfterRemoval.nodeData.has(1));
      assert.ok(graphAfterRemoval.nodeData.has(2));
    });

    it("should remove multiple nodes", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));
      const node3 = new NodeData().setId(3).setLabel("Node 3").setCoord(new Coord(2, 2));

      const graphWithNodes = graph
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addNodeWithData(node3);

      const graphAfterRemoval = graphWithNodes.removeNodes([1, 3]);

      assert.strictEqual(graphAfterRemoval.numNodes, 1);
      assert.ok(!graphAfterRemoval.nodeData.has(1));
      assert.ok(graphAfterRemoval.nodeData.has(2));
      assert.ok(!graphAfterRemoval.nodeData.has(3));
    });

    it("should update node data", () => {
      const graph = new Graph();
      const node = new NodeData().setId(1).setLabel("Original").setCoord(new Coord(0, 0));

      const graphWithNode = graph.addNodeWithData(node);
      const updatedGraph = graphWithNode.updateNodeData(1, data => data.setLabel("Updated"));

      assert.strictEqual(updatedGraph.nodeData.get(1)?.label, "Updated");
      assert.strictEqual(graphWithNode.nodeData.get(1)?.label, "Original");
    });

    it("should generate fresh node IDs", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(5).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(10).setLabel("Node 2").setCoord(new Coord(1, 1));

      const graphWithNodes = graph.addNodeWithData(node1).addNodeWithData(node2);

      assert.strictEqual(graphWithNodes.freshNodeId, 11);
    });
  });

  describe("Edge operations", () => {
    it("should add an edge with data", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));
      const edge = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const path = new PathData().setId(1).setEdges(List.of(1));

      const newGraph = graph
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addEdgeWithData(edge)
        .addPathWithData(path);

      assert.strictEqual(newGraph.numEdges, 1);
      assert.ok(newGraph.edgeData.has(1));
      assert.strictEqual(newGraph.edgeData.get(1)?.source, 1);
      assert.strictEqual(newGraph.edgeData.get(1)?.target, 2);
    });

    it("should create a self-loop edge", () => {
      const graph = new Graph();
      const node = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const selfLoop = new EdgeData().setId(1).setSource(1).setTarget(1).setPath(1);
      const path = new PathData().setId(1).setEdges(List.of(1));

      const newGraph = graph.addNodeWithData(node).addEdgeWithData(selfLoop).addPathWithData(path);

      assert.strictEqual(newGraph.numEdges, 1);
      assert.strictEqual(newGraph.numPaths, 1);
      assert.ok(newGraph.edgeData.get(1)?.isSelfLoop);
    });

    it("should add multiple edges", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));
      const node3 = new NodeData().setId(3).setLabel("Node 3").setCoord(new Coord(2, 2));

      const edge1 = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const edge2 = new EdgeData().setId(2).setSource(2).setTarget(3).setPath(2);
      const path1 = new PathData().setId(1).setEdges(List.of(1));
      const path2 = new PathData().setId(2).setEdges(List.of(2));

      const newGraph = graph
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addNodeWithData(node3)
        .addEdgeWithData(edge1)
        .addEdgeWithData(edge2)
        .addPathWithData(path1)
        .addPathWithData(path2);

      assert.strictEqual(newGraph.numEdges, 2);
      assert.strictEqual(newGraph.numPaths, 2);
      assert.ok(newGraph.edgeData.has(1));
      assert.ok(newGraph.edgeData.has(2));
    });

    it("should remove edges", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));

      const edge1 = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const edge2 = new EdgeData().setId(2).setSource(2).setTarget(1).setPath(2);
      const path1 = new PathData().setId(1).setEdges(List.of(1));
      const path2 = new PathData().setId(2).setEdges(List.of(2));

      const graphWithEdges = graph
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addEdgeWithData(edge1)
        .addEdgeWithData(edge2)
        .addPathWithData(path1)
        .addPathWithData(path2);

      const graphAfterRemoval = graphWithEdges.removeEdges([1]);

      assert.strictEqual(graphAfterRemoval.numEdges, 1);
      assert.ok(!graphAfterRemoval.edgeData.has(1));
      assert.ok(graphAfterRemoval.edgeData.has(2));
    });

    it("should automatically remove edges when removing nodes", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));
      const node3 = new NodeData().setId(3).setLabel("Node 3").setCoord(new Coord(2, 2));

      const edge1 = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const edge2 = new EdgeData().setId(2).setSource(2).setTarget(3).setPath(2);
      const edge3 = new EdgeData().setId(3).setSource(1).setTarget(3).setPath(3);

      const path1 = new PathData().setId(1).setEdges(List.of(1));
      const path2 = new PathData().setId(2).setEdges(List.of(2));
      const path3 = new PathData().setId(3).setEdges(List.of(3));

      const graphWithAll = graph
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addNodeWithData(node3)
        .addEdgeWithData(edge1)
        .addEdgeWithData(edge2)
        .addEdgeWithData(edge3)
        .addPathWithData(path1)
        .addPathWithData(path2)
        .addPathWithData(path3);

      // Remove node 1, which should also remove edges 1 and 3
      const graphAfterRemoval = graphWithAll.removeNodes([1]);

      assert.strictEqual(graphAfterRemoval.numNodes, 2);
      assert.strictEqual(graphAfterRemoval.numEdges, 1);
      assert.ok(!graphAfterRemoval.nodeData.has(1));
      assert.ok(!graphAfterRemoval.edgeData.has(1)); // Edge from node 1 to 2
      assert.ok(graphAfterRemoval.edgeData.has(2)); // Edge from node 2 to 3
      assert.ok(!graphAfterRemoval.edgeData.has(3)); // Edge from node 1 to 3
    });

    it("should update edge data", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));
      const edge = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const path = new PathData().setId(1).setEdges(List.of(1));

      const graphWithEdge = graph
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addEdgeWithData(edge)
        .addPathWithData(path);

      const updatedGraph = graphWithEdge.updateEdgeData(1, data =>
        data.setProperty("style", "dashed")
      );

      assert.strictEqual(updatedGraph.edgeData.get(1)?.property("style"), "dashed");
      assert.strictEqual(graphWithEdge.edgeData.get(1)?.property("style"), undefined);
    });

    it("should generate fresh edge IDs", () => {
      const graph = new Graph();
      const edge1 = new EdgeData().setId(5).setSource(1).setTarget(2).setPath(1);
      const edge2 = new EdgeData().setId(15).setSource(2).setTarget(1).setPath(2);
      const path1 = new PathData().setId(1).setEdges(List.of(5));
      const path2 = new PathData().setId(2).setEdges(List.of(15));

      const graphWithEdges = graph
        .addEdgeWithData(edge1)
        .addEdgeWithData(edge2)
        .addPathWithData(path1)
        .addPathWithData(path2);

      assert.strictEqual(graphWithEdges.freshEdgeId, 16);
    });
  });

  describe("Graph immutability", () => {
    it("should be immutable when adding nodes", () => {
      const graph = new Graph();
      const node = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));

      const newGraph = graph.addNodeWithData(node);

      assert.notStrictEqual(graph, newGraph);
      assert.strictEqual(graph.numNodes, 0);
      assert.strictEqual(newGraph.numNodes, 1);
    });

    it("should be immutable when removing nodes", () => {
      const graph = new Graph();
      const node = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));

      const graphWithNode = graph.addNodeWithData(node);
      const graphAfterRemoval = graphWithNode.removeNodes([1]);

      assert.notStrictEqual(graphWithNode, graphAfterRemoval);
      assert.strictEqual(graphWithNode.numNodes, 1);
      assert.strictEqual(graphAfterRemoval.numNodes, 0);
    });

    it("should support equality comparison", () => {
      const graph1 = new Graph();
      const graph2 = new Graph();
      const node = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));

      const graphWithNode1 = graph1.addNodeWithData(node);
      const graphWithNode2 = graph2.addNodeWithData(node);

      assert.ok(graph1.equals(graph2));
      assert.ok(graphWithNode1.equals(graphWithNode2));
      assert.ok(!graph1.equals(graphWithNode1));
    });
  });

  describe("Subgraph operations", () => {
    it("should create subgraph from nodes", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));
      const node3 = new NodeData().setId(3).setLabel("Node 3").setCoord(new Coord(2, 2));

      const edge1 = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const edge2 = new EdgeData().setId(2).setSource(2).setTarget(3).setPath(2);
      const path1 = new PathData().setId(1).setEdges(List.of(1));
      const path2 = new PathData().setId(2).setEdges(List.of(2));

      const fullGraph = graph
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addNodeWithData(node3)
        .addEdgeWithData(edge1)
        .addEdgeWithData(edge2)
        .addPathWithData(path1)
        .addPathWithData(path2);

      const subgraph = fullGraph.subgraphFromNodes([1, 2]);

      assert.strictEqual(subgraph.numNodes, 2);
      assert.ok(subgraph.nodeData.has(1));
      assert.ok(subgraph.nodeData.has(2));
      assert.ok(!subgraph.nodeData.has(3));

      // Should only have edges between remaining nodes
      assert.strictEqual(subgraph.numEdges, 1);
      assert.ok(subgraph.edgeData.has(1)); // Edge between nodes 1 and 2
      assert.ok(!subgraph.edgeData.has(2)); // Edge to removed node 3
    });
  });
});
