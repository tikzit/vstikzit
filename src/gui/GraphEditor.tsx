import { useEffect, useMemo, useState } from "react";
import { Set } from "immutable";

import Graph from "../data/Graph";
import { drawGrid } from "./grid";
import SceneCoords from "./SceneCoords";
import Node from "./Node";
import Edge from "./Edge";
import Styles from "../data/Styles";
import { Coord, StyleData } from "../data/Data";

export type GraphTool = "select" | "vertex" | "edge";

interface GraphEditorProps {
  tool: GraphTool;
  enabled: boolean;
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
  selectedNodes: Set<number>;
  selectedEdges: Set<number>;
  onSelectionChanged: (selectedNodes: Set<number>, selectedEdges: Set<number>) => void;
  tikzStyles: Styles;
}

const GraphEditor = ({
  tool,
  enabled,
  graph,
  onGraphChange,
  selectedNodes,
  selectedEdges,
  onSelectionChanged: changeSelection,
  tikzStyles,
}: GraphEditorProps) => {
  const sceneCoords = new SceneCoords(5000, 5000);

  // internal editor state
  // n.b. the graph itself is stored in App, and is updated by this component via onGraphChange
  const [mouseDownPos, setMouseDownPos] = useState<Coord | undefined>(undefined);
  const [mouseDragPos, setMouseDragPos] = useState<Coord | undefined>(undefined);
  const [selectionRect, setSelectionRect] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);
  const [draggingNodes, setDraggingNodes] = useState(false);
  const [clickedNode, setClickedNode] = useState<number | undefined>(undefined);
  const [clickedEdge, setClickedEdge] = useState<number | undefined>(undefined);
  const [clickedControlPoint, setClickedControlPoint] = useState<[number, 1 | 2] | undefined>(
    undefined
  );
  const [edgeStartNode, setEdgeStartNode] = useState<number | undefined>(undefined);
  const [edgeEndNode, setEdgeEndNode] = useState<number | undefined>(undefined);

  useEffect(() => {
    const graphEditor = document.getElementById("graph-editor-viewport")!;
    graphEditor.scrollLeft = Math.max(0, (sceneCoords.width - graphEditor.clientWidth) / 2);
    graphEditor.scrollTop = Math.max(0, (sceneCoords.height - graphEditor.clientHeight) / 2);
  }, []);

  useEffect(() => {
    const svg = document.getElementById("graph-editor");
    if (svg !== null) {
      drawGrid(svg, sceneCoords);
    }
  }, []);

  const addEdgeLineStart = useMemo(() => {
    if (edgeStartNode) {
      return sceneCoords.coordToScreen(graph.nodeData.get(edgeStartNode)!.coord);
    }
    return undefined;
  }, [graph, sceneCoords, edgeStartNode]);

  const addEdgeLineEnd = useMemo(() => {
    if (edgeEndNode) {
      return sceneCoords.coordToScreen(graph.nodeData.get(edgeEndNode)!.coord);
    } else if (mouseDragPos) {
      return sceneCoords.coordToScreen(mouseDragPos);
    } else {
      return undefined;
    }
  }, [graph, edgeEndNode]);

  const mousePositionToCoord = (event: React.MouseEvent<SVGSVGElement>): Coord => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return new Coord(x, y);
  };

  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    console.log("GraphEditor mouse down");
    event.preventDefault();
    if (!enabled) return;

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
        if (clickedControlPoint) {
          // dragging a control point
          // Save current state of the edge
          // _oldBend = e->bend();
          // _oldInAngle = e->inAngle();
          // _oldOutAngle = e->outAngle();
          // _oldWeight = e->weight();
        } else {
          // not dragging a control point, handle click as usual
          if (clickedNode !== undefined) {
            // select a node single node and/or prepare to drag nodes
            if (selectedNodes.contains(clickedNode)) {
              setDraggingNodes(true);
            } else {
              if (event.shiftKey) {
                changeSelection(selectedNodes.add(clickedNode), selectedEdges);
              } else {
                changeSelection(Set([clickedNode]), Set());
              }
            }
          } else if (clickedEdge !== undefined) {
            // select a single edge
            if (event.shiftKey) {
              changeSelection(selectedNodes, selectedEdges.add(clickedEdge));
            } else {
              changeSelection(Set(), Set([clickedEdge]));
            }
          } else {
            if (!event.shiftKey) {
              changeSelection(Set(), Set());
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
        setEdgeStartNode(clickedNode);
        setEdgeEndNode(clickedNode);
        break;
    }

    setMouseDownPos(p);
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (mouseDownPos === undefined || !enabled) return;
    const p = mousePositionToCoord(event);

    if (selectionRect !== undefined) {
      setSelectionRect({
        x: Math.min(mouseDownPos.x, p.x),
        y: Math.min(mouseDownPos.y, p.y),
        width: Math.abs(mouseDownPos.x - p.x),
        height: Math.abs(mouseDownPos.y - p.y),
      });
    }

    setMouseDragPos(p);
  };

  const handleMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (mouseDownPos === undefined || !enabled) return;

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

      changeSelection(sel, selectedEdges);
    }

    setMouseDownPos(undefined);
    setSelectionRect(undefined);
  };

  return (
    <div
      id="graph-editor-viewport"
      style={{ height: "100%", padding: "10px", overflow: "auto", tabSize: 4 }}
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
                onMouseDown={() => setClickedEdge(key)}
                onControlPointMouseDown={setClickedControlPoint}
                sceneCoords={sceneCoords}
              />
            );
          })}
        </g>
        <g id="control-layer">
          {addEdgeLineStart !== undefined && addEdgeLineEnd !== undefined && (
            <line
              x1={addEdgeLineStart.x}
              y1={addEdgeLineStart.y}
              x2={addEdgeLineEnd.x}
              y2={addEdgeLineEnd.y}
              stroke="rgb(100, 0, 200)"
              strokeWidth={2}
            />
          )}
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
                onMouseDown={setClickedNode}
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
      </svg>
    </div>
  );
};

export default GraphEditor;
