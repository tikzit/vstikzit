import { useEffect, useReducer, useRef, useState } from "react";
import { List, Set } from "immutable";

import Graph from "../lib/Graph";
import { drawGrid } from "../lib/grid";
import SceneCoords from "../lib/SceneCoords";
import Node from "./Node";
import Edge from "./Edge";
import Styles from "../lib/Styles";
import { Coord, EdgeData, NodeData, PathData } from "../lib/Data";
import { shortenLine } from "../lib/curve";
import { parseTikzPicture } from "../lib/TikzParser";
import { getCommandFromShortcut } from "../lib/commands";

export type GraphTool = "select" | "vertex" | "edge";

interface GraphEditorProps {
  tool: GraphTool;
  onToolChanged: (tool: GraphTool) => void;
  enabled: boolean;
  graph: Graph;
  onGraphChange: (graph: Graph, commit: boolean) => void;
  selectedNodes: Set<number>;
  selectedEdges: Set<number>;
  onSelectionChanged: (selectedNodes: Set<number>, selectedEdges: Set<number>) => void;
  onJumpToNode: (node: number) => void;
  onJumpToEdge: (edge: number) => void;
  tikzStyles: Styles;
  currentNodeStyle: string;
  currentEdgeStyle: string;
}

interface UIState {
  smartTool?: boolean;
  draggingNodes?: boolean;
  prevGraph?: Graph;
  mouseDownPos?: Coord;
  selectionRect?: { x: number; y: number; width: number; height: number };
  edgeStartNode?: number;
  edgeEndNode?: number;
  addEdgeLineStart?: Coord;
  addEdgeLineEnd?: Coord;
}

const uiStateReducer = (state: UIState, action: Partial<UIState> | "reset"): UIState => {
  if (action === "reset") {
    return {};
  } else {
    return { ...state, ...action };
  }
};

const GraphEditor = ({
  tool,
  onToolChanged: setTool,
  enabled,
  graph,
  onGraphChange: updateGraph,
  selectedNodes,
  selectedEdges,
  onSelectionChanged: updateSelection,
  onJumpToNode: jumpToNode,
  onJumpToEdge: jumpToEdge,
  tikzStyles,
  currentNodeStyle,
  currentEdgeStyle,
}: GraphEditorProps) => {
  const CTRL = window.navigator.platform.includes("Mac") ? "Meta" : "Control";
  const [sceneCoords, setSceneCoords] = useState<SceneCoords>(new SceneCoords());
  const [uiState, updateUIState] = useReducer(uiStateReducer, {});

  // refs used to pass data from node/edge components to the graph editor
  const clickedNode = useRef<number | undefined>(undefined);
  const clickedEdge = useRef<number | undefined>(undefined);
  const clickedControlPoint = useRef<[number, 1 | 2] | undefined>(undefined);

  useEffect(() => {
    // Grab focus initially and when the editor tab gains focus
    const editor = document.getElementById("graph-editor")!;
    editor.focus();
    const focusHandler = () => editor.focus();
    window.addEventListener("focus", focusHandler);

    // Center the viewport and preserve the current center point on resize
    const initCoords = new SceneCoords();
    const viewport = document.getElementById("graph-editor-viewport")!;
    let prevW = viewport.clientWidth;
    let prevH = viewport.clientHeight;
    viewport.scrollLeft = initCoords.originX - prevW / 2;
    viewport.scrollTop = initCoords.originY - prevH / 2;

    const resizeObserver = new ResizeObserver(() => {
      const w = viewport.clientWidth;
      const h = viewport.clientHeight;
      const centerX = viewport.scrollLeft + prevW / 2;
      const centerY = viewport.scrollTop + prevH / 2;
      viewport.scrollLeft = centerX - w / 2;
      viewport.scrollTop = centerY - h / 2;
      prevW = w;
      prevH = h;
    });

    resizeObserver.observe(viewport);
    return () => {
      window.removeEventListener("focus", focusHandler);
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    // Draw the background grid
    const editor = document.getElementById("graph-editor")!;
    drawGrid(editor, sceneCoords);
  }, [sceneCoords]);

  const mousePositionToCoord = (event: React.MouseEvent<SVGSVGElement>): Coord => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return new Coord(x, y);
  };

  const updateSceneCoords = (coords: SceneCoords) => {
    const viewport = document.getElementById("graph-editor-viewport")!;
    const c0 = new Coord(
      viewport.scrollLeft + viewport.clientWidth / 2,
      viewport.scrollTop + viewport.clientHeight / 2
    );
    const c1 = coords.coordToScreen(sceneCoords.coordFromScreen(c0));
    viewport.scrollLeft += c1.x - c0.x;
    viewport.scrollTop += c1.y - c0.y;
    setSceneCoords(coords);
  };

  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (!enabled) {
      return;
    }

    // Focus the SVG element to enable keyboard events
    event.currentTarget.focus();

    const p = mousePositionToCoord(event);
    updateUIState({ mouseDownPos: p, draggingNodes: false });

    let currentTool = tool;
    // if right click, activate smart tool temporarily
    if (tool === "select" && event.button === 2) {
      if (clickedNode.current !== undefined) {
        currentTool = "edge";
      } else {
        currentTool = "vertex";
      }

      updateUIState({ smartTool: true });
      setTool(currentTool);
    }

    switch (currentTool) {
      case "select":
        if (clickedControlPoint.current !== undefined) {
          updateUIState({ prevGraph: graph });
        } else if (clickedNode.current !== undefined) {
          // select a node single node and/or prepare to drag nodes
          if (event.shiftKey) {
            if (selectedNodes.contains(clickedNode.current)) {
              updateSelection(selectedNodes.remove(clickedNode.current), selectedEdges);
            } else {
              updateSelection(selectedNodes.add(clickedNode.current), selectedEdges);
            }
          } else {
            updateUIState({ prevGraph: graph, draggingNodes: true });
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
          updateUIState({
            selectionRect: {
              x: p.x,
              y: p.y,
              width: 0,
              height: 0,
            },
          });
        }

        break;
      case "vertex":
        // nothing to do
        break;
      case "edge":
        updateUIState({ edgeStartNode: clickedNode.current, edgeEndNode: clickedNode.current });
        break;
    }
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (uiState.mouseDownPos === undefined || !enabled) {
      return;
    }
    const p = mousePositionToCoord(event);

    switch (tool) {
      case "select":
        if (uiState.selectionRect !== undefined) {
          updateUIState({
            selectionRect: {
              x: Math.min(uiState.mouseDownPos.x, p.x),
              y: Math.min(uiState.mouseDownPos.y, p.y),
              width: Math.abs(uiState.mouseDownPos.x - p.x),
              height: Math.abs(uiState.mouseDownPos.y - p.y),
            },
          });
        } else if (uiState.draggingNodes && uiState.prevGraph !== undefined) {
          const c1 = sceneCoords.coordFromScreen(uiState.mouseDownPos);
          const c2 = sceneCoords.coordFromScreen(p);
          const dx = Math.round((c2.x - c1.x) * 4) / 4;
          const dy = Math.round((c2.y - c1.y) * 4) / 4;
          updateGraph(
            uiState.prevGraph.mapNodeData(d =>
              selectedNodes.contains(d.id) ? d.setCoord(d.coord.shift(dx, dy)) : d
            ),
            false
          );
        } else if (clickedControlPoint.current !== undefined) {
          const [edge, pt] = clickedControlPoint.current;
          let d = graph.edgeData.get(edge)!;
          const sourceCoord = sceneCoords.coordToScreen(graph.nodeData.get(d.source)!.coord);
          const targetCoord = sceneCoords.coordToScreen(graph.nodeData.get(d.target)!.coord);
          const dx1 = targetCoord.x - sourceCoord.x;
          const dy1 = targetCoord.y - sourceCoord.y;
          let dx2: number, dy2: number;
          if (pt === 1) {
            dx2 = p.x - sourceCoord.x;
            dy2 = p.y - sourceCoord.y;
          } else {
            dx2 = p.x - targetCoord.x;
            dy2 = p.y - targetCoord.y;
          }

          const baseDist = Math.sqrt(dx1 * dx1 + dy1 * dy1);
          const handleDist = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          if (!d.isSelfLoop) {
            let weight: number;
            if (baseDist !== 0) {
              weight = handleDist / baseDist;
            } else {
              weight = handleDist / sceneCoords.scale;
            }

            weight = Math.round(weight * 10) / 10;
            const looseness = 2.5 * weight;
            if (looseness === 1) {
              d = d.unset("looseness");
            } else {
              d = d.setProperty("looseness", looseness);
            }
          }

          // compute angle of the line connecting the node with its control point. Note we flip
          // dy because screen coordinates are inverted in the Y axis from tikz coordinates
          const controlAngle = (Math.atan2(-dy2, dx2) * 180) / Math.PI;
          if (d.basicBendMode) {
            // compute the angle of the line connecting source and target. Bend is the difference between this
            // and the control point angle
            const baseAngle = (Math.atan2(-dy1, dx1) * 180) / Math.PI;

            let bend: number;
            if (pt === 1) {
              bend = baseAngle - controlAngle;
            } else {
              bend = controlAngle - baseAngle + 180;
              if (bend > 180) {
                bend -= 360;
              }
            }
            d = d.setBend(Math.round(bend / 15) * 15);
          } else {
            if (pt === 1) {
              d = d.setProperty("out", Math.round(controlAngle / 15) * 15);
            } else {
              d = d.setProperty("in", Math.round(controlAngle / 15) * 15);
            }
          }

          updateGraph(graph.setEdgeData(edge, d), false);
        }
        break;
      case "vertex":
        // nothing to do
        break;
      case "edge":
        if (uiState.edgeStartNode !== undefined) {
          const p1 = sceneCoords.coordFromScreen(p);
          const n = graph.nodeData.find(
            d => Math.abs(d.coord.x - p1.x) < 0.22 && Math.abs(d.coord.y - p1.y) < 0.22
          )?.id;
          updateUIState({ edgeEndNode: n });
          let c1: Coord;
          let c2: Coord;
          if (n !== undefined) {
            [c1, c2] = shortenLine(
              graph.nodeData.get(uiState.edgeStartNode)!.coord,
              graph.nodeData.get(n)!.coord,
              0.2,
              0.2
            );
          } else {
            [c1, c2] = shortenLine(graph.nodeData.get(uiState.edgeStartNode)!.coord, p1, 0.2, 0);
          }
          updateUIState({
            addEdgeLineStart: sceneCoords.coordToScreen(c1),
            addEdgeLineEnd: sceneCoords.coordToScreen(c2),
          });
        }
        break;
    }
  };

  const handleMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (uiState.mouseDownPos === undefined || !enabled) {
      return;
    }
    const p = mousePositionToCoord(event);

    switch (tool) {
      case "select":
        if (event.detail === 2) {
          // double click
          if (clickedNode.current !== undefined) {
            document.getElementById("label-field")?.focus();
          } else if (clickedEdge.current !== undefined) {
            let d = graph.edgeData.get(clickedEdge.current)!;
            const sCoord = graph.nodeData.get(d.source)!.coord;
            const tCoord = graph.nodeData.get(d.target)!.coord;
            const baseAngle =
              (Math.atan2(tCoord.y - sCoord.y, tCoord.x - sCoord.x) * 180) / Math.PI;

            if (d.basicBendMode) {
              const bend = d.bend;
              const outAngle = Math.round((baseAngle - bend) / 15) * 15;
              const inAngle = Math.round((baseAngle + 180 + bend) / 15) * 15;
              d = d
                .unset("bend left")
                .unset("bend right")
                .setProperty("out", outAngle)
                .setProperty("in", inAngle);
            } else {
              const outAngle = d.propertyInt("out") ?? 0;
              const bend = Math.round((baseAngle - outAngle) / 15) * 15;
              d = d.unset("in").unset("out").setBend(bend);
            }

            updateGraph(graph.setEdgeData(d.id, d), true);
          }
        } else if (uiState.selectionRect !== undefined) {
          const sel = selectedNodes.withMutations(set => {
            for (const d of graph.nodeData.values()) {
              const c = sceneCoords.coordToScreen(d.coord);
              // if c is in selectionRect
              if (
                c.x > uiState.selectionRect!.x &&
                c.x < uiState.selectionRect!.x + uiState.selectionRect!.width &&
                c.y > uiState.selectionRect!.y &&
                c.y < uiState.selectionRect!.y + uiState.selectionRect!.height
              ) {
                set.add(d.id);
              }
            }
          });

          updateSelection(sel, selectedEdges);
        } else if (uiState.draggingNodes) {
          if (!uiState.prevGraph?.equals(graph)) {
            updateGraph(graph, true);
          }
        } else if (clickedControlPoint.current !== undefined) {
          if (!uiState.prevGraph?.equals(graph)) {
            updateGraph(graph, true);
          }
        }
        break;
      case "vertex":
        {
          const p1 = sceneCoords.coordFromScreen(p).snapToGrid(4);
          const node = new NodeData()
            .setId(graph.freshNodeId)
            .setCoord(p1)
            .setProperty("style", currentNodeStyle);
          updateGraph(graph.addNodeWithData(node), true);
        }
        break;
      case "edge":
        if (uiState.edgeStartNode !== undefined && uiState.edgeEndNode !== undefined) {
          let edge = new EdgeData()
            .setId(graph.freshEdgeId)
            .setSource(uiState.edgeStartNode)
            .setTarget(uiState.edgeEndNode);
          if (currentEdgeStyle !== "none") {
            edge = edge.setProperty("style", currentEdgeStyle);
          }
          const path = new PathData().setId(graph.freshPathId).setEdges(List([edge.id]));
          updateGraph(graph.addEdgeWithData(edge).addPathWithData(path), true);
        }
        break;
    }

    if (uiState.smartTool) {
      setTool("select");
    }

    clickedNode.current = undefined;
    clickedEdge.current = undefined;
    clickedControlPoint.current = undefined;
    updateUIState("reset");
  };

  const moveSelectedNodes = (dx: number, dy: number) => {
    if (!selectedNodes.isEmpty()) {
      const g = graph.mapNodeData(d =>
        selectedNodes.has(d.id) ? d.setCoord(d.coord.shift(dx, dy, 40)) : d
      );
      updateGraph(g, true);
    }
  };

  const handleKeyDown = async (event: React.KeyboardEvent<SVGSVGElement>) => {
    const combo = [];
    if (event.getModifierState(CTRL)) combo.push("Ctrl");
    if (event.getModifierState("Alt")) combo.push("Alt");
    if (event.getModifierState("Shift")) combo.push("Shift");
    let key: string;
    if (event.key.length === 1) {
      key = event.key === "+" ? "Plus" : event.key.toUpperCase();
    } else {
      key = event.key;
    }
    combo.push(key);

    switch (getCommandFromShortcut(combo.join("+"))?.name) {
      case "vstikzit.copy":
        if (!selectedNodes.isEmpty()) {
          window.navigator.clipboard.writeText(graph.subgraphFromNodes(selectedNodes).tikz());
        }
        break;
      case "vstikzit.cut":
        if (!selectedNodes.isEmpty()) {
          window.navigator.clipboard.writeText(graph.subgraphFromNodes(selectedNodes).tikz());
          const g = graph.removeNodes(selectedNodes);
          updateGraph(g, true);
          updateSelection(Set(), Set());
        }
        break;
      case "vstikzit.paste":
        {
          const pastedData = await window.navigator.clipboard.readText();
          const parsed = parseTikzPicture(pastedData);
          if (parsed.result !== undefined) {
            let g = parsed.result;
            let n = g.nodeData.first();
            while (
              graph.nodeData.find(d => n !== undefined && d.coord.equals(n.coord)) !== undefined
            ) {
              g = g.shiftGraph(0.5, -0.5);
              n = g.nodeData.first();
            }

            const g1 = graph.insertGraph(g);
            const sel = Set(g1.nodeData.keys()).subtract(graph.nodeData.keys());
            updateGraph(g1, true);
            updateSelection(sel, Set());
          }
        }
        break;
      case "vstikzit.jumpToTikz":
        if (selectedNodes.size === 1) {
          jumpToNode(selectedNodes.first()!);
        } else if (selectedEdges.size === 1) {
          jumpToEdge(selectedEdges.first()!);
        }
        break;
      case "vstikzit.moveLeft":
        moveSelectedNodes(-0.25, 0);
        break;
      case "vstikzit.moveRight":
        moveSelectedNodes(0.25, 0);
        break;
      case "vstikzit.moveUp":
        moveSelectedNodes(0, 0.25);
        break;
      case "vstikzit.moveDown":
        moveSelectedNodes(0, -0.25);
        break;
      case "vstikzit.nudgeLeft":
        moveSelectedNodes(-0.025, 0);
        break;
      case "vstikzit.nudgeRight":
        moveSelectedNodes(0.025, 0);
        break;
      case "vstikzit.nudgeUp":
        moveSelectedNodes(0, 0.025);
        break;
      case "vstikzit.nudgeDown":
        moveSelectedNodes(0, -0.025);
        break;
      case "vstikzit.selectTool":
        setTool("select");
        break;
      case "vstikzit.nodeTool":
        setTool("vertex");
        break;
      case "vstikzit.edgeTool":
        setTool("edge");
        break;
      case "vstikzit.delete":
        {
          const g = graph.removeNodes(selectedNodes).removeEdges(selectedEdges);
          updateGraph(g, true);
          updateSelection(Set(), Set());
        }
        break;
      case "vstikzit.zoomOut":
        {
          const coords = sceneCoords.zoomOut();
          const viewport = document.getElementById("graph-editor-viewport")!;
          if (
            coords.screenWidth >= viewport.clientWidth &&
            coords.screenHeight >= viewport.clientHeight
          ) {
            updateSceneCoords(coords);
          }
        }
        break;
      case "vstikzit.zoomIn":
        {
          const coords = sceneCoords.zoomIn();
          if (coords.scale <= 1024) {
            updateSceneCoords(coords);
          }
        }
        break;
    }
  };

  return (
    <div
      id="graph-editor-viewport"
      style={{
        height: "100%",
        maxHeight: "calc(100vh - 70px)", // Limit to viewport height minus toolbar and margins
        overflowX: "scroll",
        overflowY: "scroll",
      }}
    >
      <svg
        id="graph-editor"
        style={{
          height: `${sceneCoords.screenHeight}px`,
          width: `${sceneCoords.screenWidth}px`,
          backgroundColor: "white",
          // outline: "none", // Remove default focus outline
        }}
        tabIndex={0}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onKeyDown={handleKeyDown}
        onContextMenu={event => {
          // Prevent context menu when using smart tool with right-click
          event.preventDefault();
        }}
      >
        <g id="grid"></g>
        <g id="edgeLayer">
          {graph.edgeData.entrySeq().map(([key, data]) => (
            <Edge
              key={key}
              data={data}
              sourceData={graph.nodeData.get(data.source)!}
              targetData={graph.nodeData.get(data.target)!}
              tikzStyles={tikzStyles}
              selected={selectedEdges.has(key)}
              onMouseDown={() => (clickedEdge.current = key)}
              onControlPointMouseDown={i => (clickedControlPoint.current = [key, i])}
              sceneCoords={sceneCoords}
            />
          ))}
        </g>
        <g id="nodeLayer">
          {graph.nodeData.entrySeq().map(([key, data]) => (
            <Node
              key={key}
              data={data}
              tikzStyles={tikzStyles}
              selected={selectedNodes.has(key)}
              highlight={uiState.edgeStartNode === key || uiState.edgeEndNode === key}
              onMouseDown={() => (clickedNode.current = key)}
              sceneCoords={sceneCoords}
            />
          ))}
        </g>
        <g id="selectionLayer">
          {uiState.selectionRect && (
            <rect
              {...uiState.selectionRect}
              fill="rgba(150, 150, 200, 0.2)"
              stroke="rgba(150, 150, 200, 1)"
              strokeDasharray="5,2"
            />
          )}
        </g>
        <g id="control-layer">
          {uiState.addEdgeLineStart !== undefined && uiState.addEdgeLineEnd !== undefined && (
            <line
              x1={uiState.addEdgeLineStart.x}
              y1={uiState.addEdgeLineStart.y}
              x2={uiState.addEdgeLineEnd.x}
              y2={uiState.addEdgeLineEnd.y}
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
