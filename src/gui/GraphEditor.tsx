import { useEffect, useMemo, useRef, useState } from "react";
import { List, Set } from "immutable";

import Graph from "../lib/Graph";
import { drawGrid } from "../lib/grid";
import SceneCoords from "../lib/SceneCoords";
import Node from "./Node";
import Edge from "./Edge";
import Styles from "../lib/Styles";
import { Coord, EdgeData, NodeData, PathData } from "../lib/Data";
import { StyleData } from "../lib/Data";
import { shortenLine } from "../lib/curve";

export type GraphTool = "select" | "vertex" | "edge";

interface GraphEditorProps {
  tool: GraphTool;
  enabled: boolean;
  graph: Graph;
  onGraphChange: (graph: Graph, commit: boolean) => void;
  selectedNodes: Set<number>;
  selectedEdges: Set<number>;
  onSelectionChanged: (selectedNodes: Set<number>, selectedEdges: Set<number>) => void;
  tikzStyles: Styles;
  currentNodeStyle: string;
  currentEdgeStyle: string;
}

const GraphEditor = ({
  tool,
  enabled,
  graph,
  onGraphChange: updateGraph,
  selectedNodes,
  selectedEdges,
  onSelectionChanged: updateSelection,
  tikzStyles,
  currentNodeStyle,
  currentEdgeStyle,
}: GraphEditorProps) => {
  const [sceneCoords, setSceneCoords] = useState<SceneCoords>(new SceneCoords(5000, 5000));

  // internal editor state
  // n.b. the graph itself is stored in App, and is updated by this component via updateGraph
  const [prevGraph, setPrevGraph] = useState<Graph | undefined>(undefined);
  const [mouseDownPos, setMouseDownPos] = useState<Coord | undefined>(undefined);
  const [selectionRect, setSelectionRect] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);
  const [draggingNodes, setDraggingNodes] = useState(false);
  const [edgeStartNode, setEdgeStartNode] = useState<number | undefined>(undefined);
  const [edgeEndNode, setEdgeEndNode] = useState<number | undefined>(undefined);

  // refs used to pass data from node/edge components to the graph editor
  const clickedNode = useRef<number | undefined>(undefined);
  const clickedEdge = useRef<number | undefined>(undefined);
  const clickedControlPoint = useRef<[number, 1 | 2] | undefined>(undefined);

  useEffect(() => {
    const graphEditor = document.getElementById("graph-editor-viewport")!;
    graphEditor.scrollLeft = Math.max(0, (sceneCoords.width - graphEditor.clientWidth) / 2);
    graphEditor.scrollTop = Math.max(0, (sceneCoords.height - graphEditor.clientHeight) / 2);
  }, [sceneCoords]);

  useEffect(() => {
    const svg = document.getElementById("graph-editor");
    if (svg !== null) {
      drawGrid(svg, sceneCoords);
    }
  }, [sceneCoords]);

  const [addEdgeLineStart, setAddEdgeLineStart] = useState<Coord | undefined>(undefined);
  const [addEdgeLineEnd, setAddEdgeLineEnd] = useState<Coord | undefined>(undefined);

  const mousePositionToCoord = (event: React.MouseEvent<SVGSVGElement>): Coord => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return new Coord(x, y);
  };

  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (!enabled) {
      return;
    }

    const p = mousePositionToCoord(event);
    setMouseDownPos(p);
    setDraggingNodes(false);

    // if (event->button() == Qt::RightButton &&
    //     _tools->currentTool() == ToolPalette::SELECT &&
    //     settings.value("smart-tool-enabled", true).toBool())
    // {
    //     _smartTool = true;
    //     if (!items(_mouseDownPos).isEmpty() &&
    //         dynamic_cast<NodeItem*>(items(_mouseDownPos)[0]))
    //     {
    //         _tools->setCurrentTool(ToolPalette::EDGE);
    //     } else {
    //         _tools->setCurrentTool(ToolPalette::VERTEX);
    //     }
    // }

    switch (tool) {
      case "select":
        if (clickedControlPoint.current !== undefined) {
          // dragging a control point
          // Save current state of the edge
          // _oldBend = e->bend();
          // _oldInAngle = e->inAngle();
          // _oldOutAngle = e->outAngle();
          // _oldWeight = e->weight();
        } else {
          // not dragging a control point, handle click as usual
          if (clickedNode.current !== undefined) {
            // select a node single node and/or prepare to drag nodes
            if (event.shiftKey) {
              if (selectedNodes.contains(clickedNode.current)) {
                updateSelection(selectedNodes.remove(clickedNode.current), selectedEdges);
              } else {
                updateSelection(selectedNodes.add(clickedNode.current), selectedEdges);
              }
            } else {
              setDraggingNodes(true);
              setPrevGraph(graph);
              if (!selectedNodes.contains(clickedNode.current)) {
                updateSelection(Set([clickedNode.current]), Set());
              }
            }
          } else if (clickedEdge.current !== undefined) {
            // select a single edge
            if (event.shiftKey) {
              updateSelection(selectedNodes, selectedEdges.add(clickedEdge.current));
            } else {
              updateSelection(Set(), Set([clickedEdge.current]));
            }
          } else {
            if (!event.shiftKey) {
              updateSelection(Set(), Set());
            }

            // start rubber band selection
            setSelectionRect({
              x: p.x,
              y: p.y,
              width: 0,
              height: 0,
            });
          }
        }

        break;
      case "vertex":
        // nothing to do
        break;
      case "edge":
        setEdgeStartNode(clickedNode.current);
        setEdgeEndNode(clickedNode.current);
        break;
    }

    setMouseDownPos(p);
    clickedNode.current = undefined;
    clickedEdge.current = undefined;
    clickedControlPoint.current = undefined;
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (mouseDownPos === undefined || !enabled) {
      return;
    }
    const p = mousePositionToCoord(event);

    if (selectionRect !== undefined) {
      setSelectionRect({
        x: Math.min(mouseDownPos.x, p.x),
        y: Math.min(mouseDownPos.y, p.y),
        width: Math.abs(mouseDownPos.x - p.x),
        height: Math.abs(mouseDownPos.y - p.y),
      });
    } else if (draggingNodes && prevGraph !== undefined) {
      const c1 = sceneCoords.coordFromScreen(mouseDownPos);
      const c2 = sceneCoords.coordFromScreen(p);
      const dx = Math.round((c2.x - c1.x) * 4) / 4;
      const dy = Math.round((c2.y - c1.y) * 4) / 4;
      updateGraph(
        prevGraph.mapNodeData(d =>
          selectedNodes.contains(d.id) ? d.setCoord(d.coord.shift(dx, dy)) : d
        ),
        false
      );
    }

    if (edgeStartNode !== undefined) {
      const p1 = sceneCoords.coordFromScreen(p);
      const n = graph.nodeData.find(
        d => Math.abs(d.coord.x - p1.x) < 0.22 && Math.abs(d.coord.y - p1.y) < 0.22
      )?.id;
      setEdgeEndNode(n);
      let c1: Coord;
      let c2: Coord;
      if (n !== undefined) {
        [c1, c2] = shortenLine(
          graph.nodeData.get(edgeStartNode)!.coord,
          graph.nodeData.get(n)!.coord,
          0.2,
          0.2
        );
      } else {
        [c1, c2] = shortenLine(graph.nodeData.get(edgeStartNode)!.coord, p1, 0.2, 0);
      }
      setAddEdgeLineStart(sceneCoords.coordToScreen(c1));
      setAddEdgeLineEnd(sceneCoords.coordToScreen(c2));
    }
  };

  const handleMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (mouseDownPos === undefined || !enabled) {
      return;
    }
    const p = mousePositionToCoord(event);

    switch (tool) {
      case "select":
        if (selectionRect !== undefined) {
          const sel = selectedNodes.withMutations(set => {
            for (const d of graph.nodeData.values()) {
              let c = sceneCoords.coordToScreen(d.coord);
              // if c is in selectionRect
              if (
                c.x > selectionRect.x &&
                c.x < selectionRect.x + selectionRect.width &&
                c.y > selectionRect.y &&
                c.y < selectionRect.y + selectionRect.height
              ) {
                set.add(d.id);
              }
            }
          });

          updateSelection(sel, selectedEdges);
        } else if (draggingNodes) {
          updateGraph(graph, true);
        }
        break;
      case "vertex":
        const p1 = sceneCoords.coordFromScreen(p).snapToGrid(4);
        const node = new NodeData()
          .setId(graph.freshNodeId)
          .setCoord(p1)
          .setProperty("style", currentNodeStyle);
        updateGraph(graph.addNodeWithData(node), true);
        break;
      case "edge":
        if (edgeStartNode !== undefined && edgeEndNode !== undefined) {
          let edge = new EdgeData()
            .setId(graph.freshEdgeId)
            .setSource(edgeStartNode)
            .setTarget(edgeEndNode);
          if (currentEdgeStyle !== "none") {
            edge = edge.setProperty("style", currentEdgeStyle);
          }
          const path = new PathData().setId(graph.freshPathId).setEdges(List([edge.id]));
          updateGraph(graph.addEdgeWithData(edge).addPathWithData(path), true);
        }
        break;
    }

    setPrevGraph(undefined);
    setMouseDownPos(undefined);
    setSelectionRect(undefined);
    setEdgeStartNode(undefined);
    setEdgeEndNode(undefined);
    setAddEdgeLineStart(undefined);
    setAddEdgeLineEnd(undefined);
    setDraggingNodes(false);
  };

  return (
    <div
      id="graph-editor-viewport"
      style={{
        height: "calc(100% - 20px)",
        padding: "10px",
        overflowX: "scroll",
        overflowY: "scroll",
        tabSize: 4,
      }}
    >
      <svg
        id="graph-editor"
        style={{
          height: `${sceneCoords.height}px`,
          width: `${sceneCoords.width}px`,
          backgroundColor: "white",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <g id="grid"></g>
        <g id="edgeLayer">
          {graph.edgeData.entrySeq().map(([key, data]) => {
            const style = tikzStyles.style(data.property("style") ?? "") ?? new StyleData();
            return (
              <Edge
                key={key}
                data={data}
                sourceData={graph.nodeData.get(data.source)!}
                targetData={graph.nodeData.get(data.target)!}
                style={style}
                selected={selectedEdges.has(key)}
                onMouseDown={() => (clickedEdge.current = key)}
                onControlPointMouseDown={i => (clickedControlPoint.current = [key, i])}
                sceneCoords={sceneCoords}
              />
            );
          })}
        </g>
        <g id="nodeLayer">
          {graph.nodeData.entrySeq().map(([key, data]) => {
            const style = tikzStyles.style(data.property("style") ?? "") ?? new StyleData();
            return (
              <Node
                key={key}
                data={data}
                style={style}
                selected={selectedNodes.has(key)}
                highlight={edgeStartNode === key || edgeEndNode === key}
                onMouseDown={() => (clickedNode.current = key)}
                sceneCoords={sceneCoords}
              />
            );
          })}
        </g>
        <g id="selectionLayer">
          {selectionRect && (
            <rect
              {...selectionRect}
              fill="rgba(150, 150, 200, 0.2)"
              stroke="rgba(150, 150, 200, 1)"
              strokeDasharray="5,2"
            />
          )}
        </g>
        <g id="control-layer">
          {addEdgeLineStart !== undefined && addEdgeLineEnd !== undefined && (
            <line
              x1={addEdgeLineStart.x}
              y1={addEdgeLineStart.y}
              x2={addEdgeLineEnd.x}
              y2={addEdgeLineEnd.y}
              stroke="rgb(100, 0, 200)"
              strokeWidth={4}
            />
          )}
        </g>
      </svg>
    </div>
  );
};

export default GraphEditor;
