import { useEffect, useState } from "react";
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
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
  selectedNodes: Set<number>;
  selectedEdges: Set<number>;
  onSelectionChanged: (selectedNodes: Set<number>, selectedEdges: Set<number>) => void;
  tikzStyles: Styles;
}

const GraphEditor = ({
  tool,
  graph,
  onGraphChange,
  selectedNodes,
  selectedEdges,
  onSelectionChanged,
  tikzStyles,
}: GraphEditorProps) => {
  const sceneCoords = new SceneCoords(5000, 5000);

  // internal editor state
  // n.b. the graph itself is stored in App, and is updated by this component via onGraphChange
  const [dragStart, setDragStart] = useState<Coord | undefined>(undefined);
  const [selectionRect, setSelectionRect] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);

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

  const mousePositionToCoord = (event: React.MouseEvent<SVGSVGElement>): Coord => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    return new Coord(x, y);
  };

  const handleMouseDown = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    const p = mousePositionToCoord(event);
    setSelectionRect({
      x: p.x,
      y: p.y,
      width: 0,
      height: 0,
    });
    setDragStart(p);
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    const p = mousePositionToCoord(event);
    if (dragStart) {
      setSelectionRect({
        x: Math.min(dragStart.x, p.x),
        y: Math.min(dragStart.y, p.y),
        width: Math.abs(dragStart.x - p.x),
        height: Math.abs(dragStart.y - p.y),
      });
    }
  };

  const handleMouseUp = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();

    if (selectionRect !== undefined) {
      const sel = Set<number>().withMutations(set => {
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

      onSelectionChanged(sel, Set());
    }

    setDragStart(undefined);
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
