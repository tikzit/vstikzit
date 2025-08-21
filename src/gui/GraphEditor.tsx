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
  onSelectionChanged,
  tikzStyles,
}: GraphEditorProps) => {
  const sceneCoords = new SceneCoords(5000, 5000);

  // internal editor state
  // n.b. the graph itself is stored in App, and is updated by this component via onGraphChange
  const [mouseDownPos, setMouseDownPos] = useState<Coord | undefined>(undefined);
  const [selectionRect, setSelectionRect] = useState<
    { x: number; y: number; width: number; height: number } | undefined
  >(undefined);
  const [draggingNodes, setDraggingNodes] = useState(false);
  const [clickedNode, setClickedNode] = useState<number | undefined>(undefined);
  const [clickedEdge, setClickedEdge] = useState<number | undefined>(undefined);
  const [clickedControlPoint, setClickedControlPoint] = useState<number | undefined>(undefined);

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
    console.log("GraphEditor mouse down");
    event.preventDefault();
    if (!enabled) return;

    const p = mousePositionToCoord(event);
    setMouseDownPos(p);
    setDraggingNodes(false);

    const cpRadius = 0.1 * sceneCoords.scale; // control point radius in scene coordinates
    const cpRadius2 = cpRadius * cpRadius;

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
      //     // check if we grabbed a control point of an edge
      //     foreach (QGraphicsItem *gi, selectedItems()) {
      //         if (EdgeItem *ei = dynamic_cast<EdgeItem*>(gi)) {
      //             qreal dx, dy;

      //             dx = ei->cp1Item()->pos().x() - _mouseDownPos.x();
      //             dy = ei->cp1Item()->pos().y() - _mouseDownPos.y();

      //             if (dx*dx + dy*dy <= cpR2) {
      //                 _modifyEdgeItem = ei;
      //                 _firstControlPoint = true;
      //                 break;
      //             }

      //             dx = ei->cp2Item()->pos().x() - _mouseDownPos.x();
      //             dy = ei->cp2Item()->pos().y() - _mouseDownPos.y();

      //             if (dx*dx + dy*dy <= cpR2) {
      //                 _modifyEdgeItem = ei;
      //                 _firstControlPoint = false;
      //                 break;
      //             }
      //         }
      //     }

      //     if (_modifyEdgeItem != nullptr) {
      //         // store for undo purposes
      //         Edge *e = _modifyEdgeItem->edge();
      //         _oldBend = e->bend();
      //         _oldInAngle = e->inAngle();
      //         _oldOutAngle = e->outAngle();
      //         _oldWeight = e->weight();
      //     } else {
      //         // since we are not dragging a control point, process the click normally
      //         //views()[0]->setDragMode(QGraphicsView::RubberBandDrag);
      //         QGraphicsScene::mousePressEvent(event);

      //         if (items(_mouseDownPos).isEmpty()) {
      //             _rubberBandItem->setRect(QRectF(_mouseDownPos,_mouseDownPos));
      //             _rubberBandItem->setVisible(true);
      //             //qDebug() << "starting rubber band drag";
      //         }

      //         // save current node positions for undo support
      //         _oldNodePositions.clear();
      //         foreach (QGraphicsItem *gi, selectedItems()) {
      //             if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)) {
      //                 _oldNodePositions.insert(ni->node(), ni->node()->point());
      //             }
      //         }

      //         QList<QGraphicsItem*> its = items(_mouseDownPos);
      //         if (!its.isEmpty()) {
      //             if (dynamic_cast<NodeItem*>(its[0])) {
      //                 _draggingNodes = true;
      //             } else {
      //                 foreach (QGraphicsItem *gi, its) {
      //                     if (EdgeItem *ei = dynamic_cast<EdgeItem*>(gi)) {
      //                         _selectingEdge = ei->edge();
      //                         break;
      //                     }
      //                 }
      //             }
      //         }
      //     }

      //     break;
      // case ToolPalette::VERTEX:
      //     break;
      // case ToolPalette::EDGE:
      //     foreach (QGraphicsItem *gi, items(_mouseDownPos)) {
      //         if (NodeItem *ni = dynamic_cast<NodeItem*>(gi)){
      //             _edgeStartNodeItem = ni;
      //             _edgeEndNodeItem = ni;
      //             QLineF line(toScreen(ni->node()->point()), _mouseDownPos);
      //             _drawEdgeItem->setLine(line);
      //             _drawEdgeItem->setVisible(true);
      //             break;
      //         }
      //     }
      //     break;
    }

    setSelectionRect({
      x: p.x,
      y: p.y,
      width: 0,
      height: 0,
    });
    setMouseDownPos(p);
  };

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    event.preventDefault();
    const p = mousePositionToCoord(event);
    if (mouseDownPos) {
      setSelectionRect({
        x: Math.min(mouseDownPos.x, p.x),
        y: Math.min(mouseDownPos.y, p.y),
        width: Math.abs(mouseDownPos.x - p.x),
        height: Math.abs(mouseDownPos.y - p.y),
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
                onMouseDown={id => setClickedNode(id)}
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
