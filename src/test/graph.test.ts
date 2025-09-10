import { assert } from "chai";
import Graph from "../lib/Graph";
import { NodeData, EdgeData, PathData, Coord, arrayEquals } from "../lib/Data";

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
      assert.ok(newGraph.hasNode(1));
      assert.strictEqual(newGraph.node(1)?.label, "Node 1");
      assert.deepStrictEqual(newGraph.node(1)?.coord, new Coord(1, 2));
    });

    it("should add multiple nodes", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));

      const newGraph = graph.addNodeWithData(node1).addNodeWithData(node2);

      assert.strictEqual(newGraph.numNodes, 2);
      assert.ok(newGraph.hasNode(1));
      assert.ok(newGraph.hasNode(2));
      assert.strictEqual(newGraph.node(1)?.label, "Node 1");
      assert.strictEqual(newGraph.node(2)?.label, "Node 2");
    });

    it("should remove a single node", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));

      const graphWithNodes = graph.addNodeWithData(node1).addNodeWithData(node2);

      const graphAfterRemoval = graphWithNodes.removeNodes([1]);

      assert.strictEqual(graphAfterRemoval.numNodes, 1);
      assert.ok(!graphAfterRemoval.hasNode(1));
      assert.ok(graphAfterRemoval.hasNode(2));
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
      assert.ok(!graphAfterRemoval.hasNode(1));
      assert.ok(graphAfterRemoval.hasNode(2));
      assert.ok(!graphAfterRemoval.hasNode(3));
    });

    it("should update node data", () => {
      const graph = new Graph();
      const node = new NodeData().setId(1).setLabel("Original").setCoord(new Coord(0, 0));

      const graphWithNode = graph.addNodeWithData(node);
      const updatedGraph = graphWithNode.updateNodeData(1, data => data.setLabel("Updated"));

      assert.strictEqual(updatedGraph.node(1)?.label, "Updated");
      assert.strictEqual(graphWithNode.node(1)?.label, "Original");
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
      const path = new PathData().setId(1).setEdges([1]);

      const newGraph = graph
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addEdgeWithData(edge)
        .addPathWithData(path);

      assert.strictEqual(newGraph.numEdges, 1);
      assert.ok(newGraph.hasEdge(1));
      assert.strictEqual(newGraph.edge(1)?.source, 1);
      assert.strictEqual(newGraph.edge(1)?.target, 2);
    });

    it("should create a self-loop edge", () => {
      const graph = new Graph();
      const node = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const selfLoop = new EdgeData().setId(1).setSource(1).setTarget(1).setPath(1);
      const path = new PathData().setId(1).setEdges([1]);

      const newGraph = graph.addNodeWithData(node).addEdgeWithData(selfLoop).addPathWithData(path);

      assert.strictEqual(newGraph.numEdges, 1);
      assert.strictEqual(newGraph.numPaths, 1);
      assert.ok(newGraph.edge(1)?.isSelfLoop);
    });

    it("should add multiple edges", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));
      const node3 = new NodeData().setId(3).setLabel("Node 3").setCoord(new Coord(2, 2));

      const edge1 = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const edge2 = new EdgeData().setId(2).setSource(2).setTarget(3).setPath(2);
      const path1 = new PathData().setId(1).setEdges([1]);
      const path2 = new PathData().setId(2).setEdges([2]);

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
      assert.ok(newGraph.hasEdge(1));
      assert.ok(newGraph.hasEdge(2));
    });

    it("should remove edges", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));

      const edge1 = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const edge2 = new EdgeData().setId(2).setSource(2).setTarget(1).setPath(2);
      const path1 = new PathData().setId(1).setEdges([1]);
      const path2 = new PathData().setId(2).setEdges([2]);

      const graphWithEdges = graph
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addEdgeWithData(edge1)
        .addEdgeWithData(edge2)
        .addPathWithData(path1)
        .addPathWithData(path2);

      const graphAfterRemoval = graphWithEdges.removeEdges([1]);

      assert.strictEqual(graphAfterRemoval.numEdges, 1);
      assert.ok(!graphAfterRemoval.hasEdge(1));
      assert.ok(graphAfterRemoval.hasEdge(2));
    });

    it("should automatically remove edges when removing nodes", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));
      const node3 = new NodeData().setId(3).setLabel("Node 3").setCoord(new Coord(2, 2));

      const edge1 = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const edge2 = new EdgeData().setId(2).setSource(2).setTarget(3).setPath(2);
      const edge3 = new EdgeData().setId(3).setSource(1).setTarget(3).setPath(3);

      const path1 = new PathData().setId(1).setEdges([1]);
      const path2 = new PathData().setId(2).setEdges([2]);
      const path3 = new PathData().setId(3).setEdges([3]);

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
      assert.ok(!graphAfterRemoval.hasNode(1));
      assert.ok(!graphAfterRemoval.hasEdge(1)); // Edge from node 1 to 2
      assert.ok(graphAfterRemoval.hasEdge(2)); // Edge from node 2 to 3
      assert.ok(!graphAfterRemoval.hasEdge(3)); // Edge from node 1 to 3
    });

    it("should update edge data", () => {
      const graph = new Graph();
      const node1 = new NodeData().setId(1).setLabel("Node 1").setCoord(new Coord(0, 0));
      const node2 = new NodeData().setId(2).setLabel("Node 2").setCoord(new Coord(1, 1));
      const edge = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const path = new PathData().setId(1).setEdges([1]);

      const graphWithEdge = graph
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addEdgeWithData(edge)
        .addPathWithData(path);

      const updatedGraph = graphWithEdge.updateEdgeData(1, data =>
        data.setProperty("style", "dashed")
      );

      assert.strictEqual(updatedGraph.edge(1)?.property("style"), "dashed");
      assert.strictEqual(graphWithEdge.edge(1)?.property("style"), undefined);
    });

    it("should generate fresh edge IDs", () => {
      const graph = new Graph();
      const edge1 = new EdgeData().setId(5).setSource(1).setTarget(2).setPath(1);
      const edge2 = new EdgeData().setId(15).setSource(2).setTarget(1).setPath(2);
      const path1 = new PathData().setId(1).setEdges([5]);
      const path2 = new PathData().setId(2).setEdges([15]);

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
      const path1 = new PathData().setId(1).setEdges([1]);
      const path2 = new PathData().setId(2).setEdges([2]);

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
      assert.ok(subgraph.hasNode(1));
      assert.ok(subgraph.hasNode(2));
      assert.ok(!subgraph.hasNode(3));

      // Should only have edges between remaining nodes
      assert.strictEqual(subgraph.numEdges, 1);
      assert.ok(subgraph.hasEdge(1)); // Edge between nodes 1 and 2
      assert.ok(!subgraph.hasEdge(2)); // Edge to removed node 3

      // Should have one path
      assert.strictEqual(subgraph.numPaths, 1);
      assert.ok(subgraph.hasPath(1)); // Path 1 is still present
      assert.ok(!subgraph.hasPath(2)); // Path 2 is removed
    });
  });

  describe("Inserting graphs", () => {
    it("should insert another graph correctly", () => {
      const node1 = new NodeData().setId(1);
      const node2 = new NodeData().setId(2);
      const edge1 = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const path1 = new PathData().setId(1).setEdges([1]);

      const graph1 = new Graph()
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addEdgeWithData(edge1)
        .addPathWithData(path1);

      const node3 = new NodeData().setId(3);
      const node4 = new NodeData().setId(4);
      const edge2 = new EdgeData().setId(2).setSource(3).setTarget(4).setPath(2);
      const path2 = new PathData().setId(2).setEdges([2]);

      const graph2 = new Graph()
        .addNodeWithData(node3)
        .addNodeWithData(node4)
        .addEdgeWithData(edge2)
        .addPathWithData(path2);

      const combinedGraph = graph1.insertGraph(graph2);

      assert.strictEqual(combinedGraph.numNodes, 4, "Combined graph should have 4 nodes");
      assert.strictEqual(combinedGraph.numEdges, 2, "Combined graph should have 2 edges");
      assert.strictEqual(combinedGraph.numPaths, 2, "Combined graph should have 2 paths");
      assert.ok(combinedGraph.hasNode(3), "Node 3 should be present");
      assert.ok(combinedGraph.hasNode(4), "Node 4 should be present");
      assert.ok(combinedGraph.hasEdge(2), "Edge 2 should be present");
      assert.ok(combinedGraph.hasPath(2), "Path 2 should be present");
      assert.strictEqual(combinedGraph.edge(2)?.source, 3, "Edge 2 should have source 3");
      assert.strictEqual(combinedGraph.edge(2)?.target, 4, "Edge 2 should have target 4");
      assert.strictEqual(combinedGraph.edge(2)?.path, 2, "Edge 2 should belong to path 2");
      assert.ok(combinedGraph.path(2)?.edges.includes(2), "Path 2 should include edge 2");
    });

    it("should assign fresh names correctly", () => {
      const node1 = new NodeData().setId(1);
      const node2 = new NodeData().setId(2);
      const edge1 = new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1);
      const path1 = new PathData().setId(1).setEdges([1]);

      const graph1 = new Graph()
        .addNodeWithData(node1)
        .addNodeWithData(node2)
        .addEdgeWithData(edge1)
        .addPathWithData(path1);

      const combinedGraph = graph1.insertGraph(graph1).insertGraph(graph1);

      assert.strictEqual(combinedGraph.numNodes, 6, "Combined graph should have 6 nodes");
      assert.strictEqual(combinedGraph.numEdges, 3, "Combined graph should have 3 edges");
      assert.strictEqual(combinedGraph.numPaths, 3, "Combined graph should have 3 paths");

      // check nodes, edges, and paths are present
      assert.ok(combinedGraph.hasNode(3), "Node 3 should be present");
      assert.ok(combinedGraph.hasNode(4), "Node 4 should be present");
      assert.ok(combinedGraph.hasNode(5), "Node 5 should be present");
      assert.ok(combinedGraph.hasNode(6), "Node 6 should be present");
      assert.ok(combinedGraph.hasEdge(2), "Edge 2 should be present");
      assert.ok(combinedGraph.hasPath(2), "Path 2 should be present");
      assert.ok(combinedGraph.hasEdge(2), "Edge 3 should be present");
      assert.ok(combinedGraph.hasPath(2), "Path 3 should be present");

      assert.strictEqual(combinedGraph.edge(2)?.source, 3, "Edge 2 should have source 3");
      assert.strictEqual(combinedGraph.edge(2)?.target, 4, "Edge 2 should have target 4");
      assert.strictEqual(combinedGraph.edge(3)?.source, 5, "Edge 3 should have source 5");
      assert.strictEqual(combinedGraph.edge(3)?.target, 6, "Edge 3 should have target 6");
      assert.strictEqual(combinedGraph.edge(2)?.path, 2, "Edge 2 should belong to path 2");
      assert.strictEqual(combinedGraph.edge(3)?.path, 3, "Edge 3 should belong to path 3");
      assert.ok(combinedGraph.path(2)?.edges.includes(2), "Path 2 should include edge 2");
      assert.ok(combinedGraph.path(3)?.edges.includes(3), "Path 3 should include edge 3");
    });
  });

  describe("Path operations", () => {
    it("should remove a path when removing all its edges", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));
      graph = graph.addNodeWithData(new NodeData().setId(4));
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(2).setTarget(3).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(3).setSource(3).setTarget(4).setPath(1));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1, 2, 3]));

      assert.strictEqual(graph.numPaths, 1);
      assert.strictEqual(graph.numEdges, 3);
      assert.ok(arrayEquals(graph.path(1)?.edges, [1, 2, 3]));

      const graph1 = graph.removeEdges([1, 2, 3]);

      assert.strictEqual(graph1.numPaths, 0);
      assert.strictEqual(graph1.numEdges, 0);
      assert.ok(!graph1.hasPath(1));
    });

    it("should shorten a path when removing an edge at the beginning or end", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));
      graph = graph.addNodeWithData(new NodeData().setId(4));
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(2).setTarget(3).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(3).setSource(3).setTarget(4).setPath(1));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1, 2, 3]));

      assert.strictEqual(graph.numPaths, 1);
      assert.strictEqual(graph.numEdges, 3);
      assert.ok(arrayEquals(graph.path(1)?.edges, [1, 2, 3]));

      const graph1 = graph.removeEdges([1]);
      const graph2 = graph.removeEdges([3]);

      assert.strictEqual(graph1.numPaths, 1);
      assert.strictEqual(graph1.numEdges, 2);
      assert.ok(arrayEquals(graph1.path(1)?.edges, [2, 3]));

      assert.strictEqual(graph2.numPaths, 1);
      assert.strictEqual(graph2.numEdges, 2);
      assert.ok(arrayEquals(graph2.path(1)?.edges, [1, 2]));
    });

    it("should split a path when removing an edge in the middle", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));
      graph = graph.addNodeWithData(new NodeData().setId(4));
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(2).setTarget(3).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(3).setSource(3).setTarget(4).setPath(1));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1, 2, 3]));

      assert.strictEqual(graph.numPaths, 1);
      assert.strictEqual(graph.numEdges, 3);
      assert.ok(arrayEquals(graph.path(1)?.edges, [1, 2, 3]));

      const graph1 = graph.removeEdges([2]);

      assert.strictEqual(graph1.numPaths, 2);
      assert.strictEqual(graph1.numEdges, 2);
      assert.ok(arrayEquals(graph1.path(1)?.edges, [1]));
      assert.ok(arrayEquals(graph1.path(2)?.edges, [3]));
    });
  });

  describe("Path splitting operations", () => {
    it("should split a single-edge path (no change)", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1]));

      const splitGraph = graph.splitPath(1);

      // Splitting a single-edge path should result in no change
      assert.strictEqual(splitGraph.numPaths, 1);
      assert.strictEqual(splitGraph.numEdges, 1);
      assert.ok(arrayEquals(splitGraph.path(1)?.edges, [1]));
      assert.strictEqual(splitGraph.edge(1)?.path, 1);
    });

    it("should split a two-edge path into two single-edge paths", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(2).setTarget(3).setPath(1));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1, 2]));

      const splitGraph = graph.splitPath(1);

      assert.strictEqual(splitGraph.numPaths, 2);
      assert.strictEqual(splitGraph.numEdges, 2);

      // First path should contain only the first edge
      assert.ok(arrayEquals(splitGraph.path(1)?.edges, [1]), "First path should contain edge 1");
      assert.strictEqual(splitGraph.edge(1)?.path, 1);

      // Second path should contain only the second edge with a new path ID
      const newPathId = splitGraph.pathIds.find(id => id !== 1)!;
      assert.ok(
        arrayEquals(splitGraph.path(newPathId)?.edges, [2]),
        "Second path should contain edge 2"
      );
      assert.strictEqual(splitGraph.edge(2)?.path, newPathId);

      // Original path should no longer be a cycle
      assert.strictEqual(splitGraph.path(1)?.isCycle, false);
    });

    it("should split a multi-edge path into individual single-edge paths", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));
      graph = graph.addNodeWithData(new NodeData().setId(4));
      graph = graph.addNodeWithData(new NodeData().setId(5));
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(2).setTarget(3).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(3).setSource(3).setTarget(4).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(4).setSource(4).setTarget(5).setPath(1));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1, 2, 3, 4]));

      const splitGraph = graph.splitPath(1);

      assert.strictEqual(splitGraph.numPaths, 4);
      assert.strictEqual(splitGraph.numEdges, 4);

      // First path should contain only the first edge
      assert.ok(arrayEquals(splitGraph.path(1)?.edges, [1]));
      assert.strictEqual(splitGraph.edge(1)?.path, 1);

      // Each subsequent edge should be in its own path
      assert.strictEqual(splitGraph.numPaths, 4);

      for (let i = 2; i <= 4; i++) {
        const pathId = splitGraph.edge(i)?.path;
        assert.ok(pathId !== undefined);
        assert.ok(arrayEquals(splitGraph.path(pathId!)?.edges, [i]));
      }
    });

    it("should split a cyclic path correctly", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(2).setTarget(3).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(3).setSource(3).setTarget(1).setPath(1));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1, 2, 3]).setIsCycle(true));

      const splitGraph = graph.splitPath(1);

      assert.strictEqual(splitGraph.numPaths, 3);
      assert.strictEqual(splitGraph.numEdges, 3);

      // Original path should no longer be a cycle after splitting
      assert.strictEqual(splitGraph.path(1)?.isCycle, false);
    });
  });

  describe("Path joining operations", () => {
    it("should join two connecting paths (target to source)", () => {
      let graph = new Graph();
      // Create nodes 1 -> 2 -> 3 -> 4
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));
      graph = graph.addNodeWithData(new NodeData().setId(4));

      // Create two separate paths that connect: path1 (1->2) and path2 (2->3)
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(2).setTarget(3).setPath(2));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1]));
      graph = graph.addPathWithData(new PathData().setId(2).setEdges([2]));

      const joinedGraph = graph.joinPaths([1, 2]);

      assert.strictEqual(joinedGraph.numPaths, 1);
      assert.strictEqual(joinedGraph.numEdges, 2);

      // Path 1 should now contain both edges
      assert.ok(arrayEquals(joinedGraph.path(1)?.edges, [1, 2]));
      assert.ok(!joinedGraph.hasPath(2)); // Path 2 should be removed

      // Both edges should belong to path 1
      assert.strictEqual(joinedGraph.edge(1)?.path, 1);
      assert.strictEqual(joinedGraph.edge(2)?.path, 1);
    });

    it("should join two connecting paths (source to target) with reversal", () => {
      let graph = new Graph();
      // Create nodes 1 -> 2 -> 3
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));

      // Create two paths: path1 (2->3) and path2 (1->2)
      // These connect at node 2, but path2 needs to be prepended to path1
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(2).setTarget(3).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(1).setTarget(2).setPath(2));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1]));
      graph = graph.addPathWithData(new PathData().setId(2).setEdges([2]));

      const joinedGraph = graph.joinPaths([1, 2]);

      assert.strictEqual(joinedGraph.numPaths, 1);
      assert.strictEqual(joinedGraph.numEdges, 2);

      // Path 1 should now contain both edges in correct order
      assert.ok(arrayEquals(joinedGraph.path(1)?.edges, [2, 1]));
      assert.ok(!joinedGraph.hasPath(2)); // Path 2 should be removed
    });

    it("should join paths that connect at their endpoints with reversal", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));
      graph = graph.addNodeWithData(new NodeData().setId(4));

      // Create two paths: path1 (1->2) and path2 (4->3)
      // Both have target 2 and 3 respectively, so path2 needs to be reversed and appended
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(4).setTarget(3).setPath(2));
      graph = graph.addEdgeWithData(new EdgeData().setId(3).setSource(2).setTarget(3).setPath(3));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1]));
      graph = graph.addPathWithData(new PathData().setId(2).setEdges([2]));
      graph = graph.addPathWithData(new PathData().setId(3).setEdges([3]));

      // Join paths 1 and 3 (1->2 and 2->3)
      const joinedGraph = graph.joinPaths([1, 3]);

      assert.strictEqual(joinedGraph.numPaths, 2); // Path 2 remains separate
      assert.strictEqual(joinedGraph.numEdges, 3);

      // Path 1 should contain edges 1 and 3
      assert.ok(arrayEquals(joinedGraph.path(1)?.edges, [1, 3]));
      assert.ok(joinedGraph.hasPath(2)); // Path 2 should still exist
      assert.ok(!joinedGraph.hasPath(3)); // Path 3 should be removed
    });

    it("should not join paths that don't connect", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));
      graph = graph.addNodeWithData(new NodeData().setId(4));

      // Create two separate, non-connecting paths: path1 (1->2) and path2 (3->4)
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(3).setTarget(4).setPath(2));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1]));
      graph = graph.addPathWithData(new PathData().setId(2).setEdges([2]));

      const originalGraph = graph;
      const joinedGraph = graph.joinPaths([1, 2]);

      // Graph should remain unchanged since paths don't connect
      assert.ok(joinedGraph.equals(originalGraph));
      assert.strictEqual(joinedGraph.numPaths, 2);
      assert.strictEqual(joinedGraph.numEdges, 2);
      assert.ok(arrayEquals(joinedGraph.path(1)?.edges, [1]));
      assert.ok(arrayEquals(joinedGraph.path(2)?.edges, [2]));
    });

    it("should handle joining multiple paths in sequence", () => {
      let graph = new Graph();
      // Create a chain: 1 -> 2 -> 3 -> 4 -> 5
      for (let i = 1; i <= 5; i++) {
        graph = graph.addNodeWithData(new NodeData().setId(i));
      }

      // Create separate paths for each edge
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(2).setTarget(3).setPath(2));
      graph = graph.addEdgeWithData(new EdgeData().setId(3).setSource(3).setTarget(4).setPath(3));
      graph = graph.addEdgeWithData(new EdgeData().setId(4).setSource(4).setTarget(5).setPath(4));

      for (let i = 1; i <= 4; i++) {
        graph = graph.addPathWithData(new PathData().setId(i).setEdges([i]));
      }

      const joinedGraph = graph.joinPaths([1, 2, 3, 4]);

      assert.strictEqual(joinedGraph.numPaths, 1);
      assert.strictEqual(joinedGraph.numEdges, 4);

      // All edges should be in path 1
      assert.ok(arrayEquals(joinedGraph.path(1)?.edges, [1, 2, 3, 4]));
      for (let i = 1; i <= 4; i++) {
        assert.strictEqual(joinedGraph.edge(i)?.path, 1);
      }

      // Other paths should be removed
      for (let i = 2; i <= 4; i++) {
        assert.ok(!joinedGraph.hasPath(i));
      }
    });

    it("should create a cycle when joining paths that form a loop", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addNodeWithData(new NodeData().setId(3));

      // Create a triangle: 1->2, 2->3, 3->1
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(2).setTarget(3).setPath(2));
      graph = graph.addEdgeWithData(new EdgeData().setId(3).setSource(3).setTarget(1).setPath(3));

      for (let i = 1; i <= 3; i++) {
        graph = graph.addPathWithData(new PathData().setId(i).setEdges([i]));
      }

      const joinedGraph = graph.joinPaths([1, 2, 3]);

      assert.strictEqual(joinedGraph.numPaths, 1);
      assert.strictEqual(joinedGraph.numEdges, 3);

      // Should form a cycle
      assert.strictEqual(joinedGraph.path(1)?.isCycle, true, "Joined path should be a cycle");
      assert.ok(
        arrayEquals(joinedGraph.path(1)?.edges, [1, 2, 3]),
        "Joined path should contain all edges"
      );
    });

    it("should handle joining with partially connecting paths", () => {
      let graph = new Graph();
      // Create nodes 1,2,3,4,5
      for (let i = 1; i <= 5; i++) {
        graph = graph.addNodeWithData(new NodeData().setId(i));
      }

      // Create paths: 1->2, 2->3, 4->5
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(2).setTarget(3).setPath(2));
      graph = graph.addEdgeWithData(new EdgeData().setId(3).setSource(4).setTarget(5).setPath(3));

      for (let i = 1; i <= 3; i++) {
        graph = graph.addPathWithData(new PathData().setId(i).setEdges([i]));
      }

      const joinedGraph = graph.joinPaths([1, 2, 3]);

      // should be a no-op since path 3 doesn't connect
      assert.ok(joinedGraph.equals(graph));
    });

    it("should return original graph when trying to join empty path list", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1]));

      const joinedGraph = graph.joinPaths([]);

      assert.ok(joinedGraph.equals(graph));
    });

    it("should return original graph when trying to join single path", () => {
      let graph = new Graph();
      graph = graph.addNodeWithData(new NodeData().setId(1));
      graph = graph.addNodeWithData(new NodeData().setId(2));
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1]));

      const joinedGraph = graph.joinPaths([1]);

      assert.ok(joinedGraph.equals(graph));
    });

    it("should handle complex path reversal scenarios", () => {
      let graph = new Graph();
      // Create nodes for a more complex scenario
      for (let i = 1; i <= 4; i++) {
        graph = graph.addNodeWithData(new NodeData().setId(i));
      }

      // Create paths that require different types of reversals:
      // path1: 1->2 (normal)
      // path2: 4->3 (will be reversed to connect 3->4 with path3)
      // path3: 2->3 (connects with path1: 1->2->3)
      graph = graph.addEdgeWithData(new EdgeData().setId(1).setSource(1).setTarget(2).setPath(1));
      graph = graph.addEdgeWithData(new EdgeData().setId(2).setSource(4).setTarget(3).setPath(2));
      graph = graph.addEdgeWithData(new EdgeData().setId(3).setSource(2).setTarget(3).setPath(3));

      graph = graph.addPathWithData(new PathData().setId(1).setEdges([1]));
      graph = graph.addPathWithData(new PathData().setId(2).setEdges([2]));
      graph = graph.addPathWithData(new PathData().setId(3).setEdges([3]));

      // Join paths 1 and 3 first (should work: 1->2, 2->3)
      const joinedGraph = graph.joinPaths([1, 3]);

      assert.strictEqual(joinedGraph.numPaths, 2);

      // Check that path 1 now contains both edges
      const path1Data = joinedGraph.path(1);
      assert.ok(path1Data, "Path 1 should exist after joining");
      assert.ok(arrayEquals(path1Data.edges, [1, 3]), "Path 1 should contain edges 1 and 3");

      // Path 2 should remain separate and unchanged
      assert.ok(joinedGraph.hasPath(2), "Path 2 should remain separate");
      const path2Data = joinedGraph.path(2);
      assert.ok(path2Data, "Path 2 should exist");
      assert.ok(arrayEquals(path2Data.edges, [2]), "Path 2 should still contain only edge 2");

      // Path 3 should be removed
      assert.ok(!joinedGraph.hasPath(3), "Path 3 should be removed");
    });
  });
});
