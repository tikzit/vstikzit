import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { parseTikzPicture } from "../lib/TikzParser";

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
  const [addEdgeLineStart, setAddEdgeLineStart] = useState<Coord | undefined>(undefined);
  const [addEdgeLineEnd, setAddEdgeLineEnd] = useState<Coord | undefined>(undefined);

  const [smartTool, setSmartTool] = useState<boolean>(false);

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
    setMouseDownPos(p);
    setDraggingNodes(false);

    let currentTool = tool;
    // if right click, activate smart tool temporarily
    if (tool === "select" && event.button === 2) {
      if (clickedNode.current !== undefined) {
        currentTool = "edge";
      } else {
        currentTool = "vertex";
      }

      setSmartTool(true);
      setTool(currentTool);
    }

    switch (currentTool) {
      case "select":
        if (clickedControlPoint.current !== undefined) {
          setPrevGraph(graph);
        } else if (clickedNode.current !== undefined) {
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
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    if (mouseDownPos === undefined || !enabled) {
      return;
    }
    const p = mousePositionToCoord(event);

    switch (tool) {
      case "select":
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
        break;
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
        } else if (selectionRect !== undefined) {
          const sel = selectedNodes.withMutations(set => {
            for (const d of graph.nodeData.values()) {
              const c = sceneCoords.coordToScreen(d.coord);
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
          if (!prevGraph?.equals(graph)) {
            updateGraph(graph, true);
          }
        } else if (clickedControlPoint.current !== undefined) {
          if (!prevGraph?.equals(graph)) {
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

    if (smartTool) {
      setTool("select");
      setSmartTool(false);
    }

    clickedNode.current = undefined;
    clickedEdge.current = undefined;
    clickedControlPoint.current = undefined;
    setPrevGraph(undefined);
    setMouseDownPos(undefined);
    setSelectionRect(undefined);
    setEdgeStartNode(undefined);
    setEdgeEndNode(undefined);
    setAddEdgeLineStart(undefined);
    setAddEdgeLineEnd(undefined);
    setDraggingNodes(false);
  };

  const handleKeyDown = async (event: React.KeyboardEvent<SVGSVGElement>) => {
    const combo = [];
    if (event.getModifierState(CTRL)) combo.push("ctrl");
    if (event.getModifierState("Alt")) combo.push("alt");
    combo.push(event.key === "+" ? "Plus" : event.key);

    const nudge = event.shiftKey ? 0.025 : 0.25;

    switch (combo.join("+")) {
      case "ctrl+alt+c":
        if (!selectedNodes.isEmpty()) {
          window.navigator.clipboard.writeText(graph.subgraphFromNodes(selectedNodes).tikz());
        }
        break;
      case "ctrl+alt+x":
        if (!selectedNodes.isEmpty()) {
          window.navigator.clipboard.writeText(graph.subgraphFromNodes(selectedNodes).tikz());
          const g = graph.removeNodes(selectedNodes);
          updateGraph(g, true);
          updateSelection(Set(), Set());
        }
        break;
      case "ctrl+alt+v":
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
      case "ctrl+J":
        if (selectedNodes.size === 1) {
          jumpToNode(selectedNodes.first()!);
        } else if (selectedEdges.size === 1) {
          jumpToEdge(selectedEdges.first()!);
        }
        break;
      case "ctrl+ArrowLeft":
        if (!selectedNodes.isEmpty()) {
          const g = graph.mapNodeData(d =>
            selectedNodes.has(d.id) ? d.setCoord(d.coord.shift(-nudge, 0, 40)) : d
          );
          updateGraph(g, true);
        }
        break;
      case "ctrl+ArrowRight":
        if (!selectedNodes.isEmpty()) {
          const g = graph.mapNodeData(d =>
            selectedNodes.has(d.id) ? d.setCoord(d.coord.shift(nudge, 0, 40)) : d
          );
          updateGraph(g, true);
        }
        break;
      case "ctrl+ArrowUp":
        if (!selectedNodes.isEmpty()) {
          const g = graph.mapNodeData(d =>
            selectedNodes.has(d.id) ? d.setCoord(d.coord.shift(0, nudge, 40)) : d
          );
          updateGraph(g, true);
        }
        break;
      case "ctrl+ArrowDown":
        if (!selectedNodes.isEmpty()) {
          const g = graph.mapNodeData(d =>
            selectedNodes.has(d.id) ? d.setCoord(d.coord.shift(0, -nudge, 40)) : d
          );
          updateGraph(g, true);
        }
        break;
      case "s":
        setTool("select");
        break;
      case "n":
        setTool("vertex");
        break;
      case "e":
        setTool("edge");
        break;
      case "Delete":
        {
          const g = graph.removeNodes(selectedNodes).removeEdges(selectedEdges);
          updateGraph(g, true);
          updateSelection(Set(), Set());
        }
        break;
      case "-":
      case "_":
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
      case "=":
      case "+":
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
        onContextMenu={(event) => {
          // Prevent context menu when using smart tool with right-click
          event.preventDefault();
        }}
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
