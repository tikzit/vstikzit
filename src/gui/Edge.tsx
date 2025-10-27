import { useState } from "preact/hooks";
import { Coord, EdgeData, NodeData, StyleData } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import { colorToHex } from "../lib/color";
import { computeControlPoints, tangent } from "../lib/curve";
import Styles from "../lib/Styles";

interface EdgeProps {
  data: EdgeData;
  sourceData: NodeData;
  targetData: NodeData;
  tikzStyles: Styles;
  selected?: boolean;
  onMouseDown?: () => void;
  onControlPointMouseDown?: (cp: 1 | 2) => void;
  sceneCoords: SceneCoords;
}

const Edge = ({
  data,
  sourceData,
  targetData,
  tikzStyles,
  selected,
  onMouseDown,
  onControlPointMouseDown,
  sceneCoords,
}: EdgeProps) => {
  const style = tikzStyles.style(data.property("style"));
  const computed = computeControlPoints(tikzStyles, sourceData, targetData, data);
  let [c1, c2, cp1, cp2] = computed[0];
  let cpDist = computed[1];
  const bezier = computed[2];

  let dashArray: string | undefined = undefined;
  if (style.hasKey("dashed")) {
    dashArray = `${0.1 * sceneCoords.scale} ${0.0333 * sceneCoords.scale}`;
  } else if (style.hasKey("dotted")) {
    dashArray = `${0.05 * sceneCoords.scale} ${0.0143 * sceneCoords.scale}`;
  }

  let arrowTail: Coord[] | undefined = undefined;
  if (style.arrowTail !== "none") {
    const tt = tangent([c1, c2, cp1, cp2], 0.0, 0.1);
    if (style.arrowTail === "flat") {
      arrowTail = [c1.shift(-tt.y, tt.x), c1, c1.shift(tt.y, -tt.x)];
    } else if (style.arrowTail === "pointer") {
      arrowTail = [c1.shift(tt.x - tt.y, tt.x + tt.y), c1, c1.shift(tt.x + tt.y, -tt.x + tt.y)];
    }
  }

  let arrowHead: Coord[] | undefined = undefined;
  if (style.arrowHead !== "none") {
    const ht = tangent([c1, c2, cp1, cp2], 1.0, 0.9);
    if (style.arrowHead === "flat") {
      arrowHead = [c2.shift(-ht.y, ht.x), c2, c2.shift(ht.y, -ht.x)];
    } else if (style.arrowHead === "pointer") {
      arrowHead = [c2.shift(ht.x - ht.y, ht.x + ht.y), c2, c2.shift(ht.x + ht.y, -ht.x + ht.y)];
    }
  }

  const basicBendMode = !data.hasKey("in") && !data.hasKey("out");
  const controlColor1 = basicBendMode ? "blue" : "rgb(0,100,0)";
  const controlColor2 = basicBendMode ? "rgba(100,100,255,0.4)" : "rgba(0,150,0,0.2)";
  const strokeWidth = sceneCoords.scale * 0.035;
  const drawColor = colorToHex(style.property("tikzit draw") ?? style.property("draw")) ?? "black";

  // map coords to screen
  const nodeCoord1 = sceneCoords.coordToScreen(sourceData.coord);
  const nodeCoord2 = sceneCoords.coordToScreen(targetData.coord);
  cpDist *= sceneCoords.scale;
  [c1, c2, cp1, cp2] = [c1, c2, cp1, cp2].map(p => sceneCoords.coordToScreen(p));
  arrowTail = arrowTail?.map(p => sceneCoords.coordToScreen(p));
  arrowHead = arrowHead?.map(p => sceneCoords.coordToScreen(p));

  const [highlightOpacity, setHighlightOpacity] = useState(0);

  return (
    <g onMouseOver={() => setHighlightOpacity(0.3)} onMouseOut={() => setHighlightOpacity(0)}>
      <g onMouseDown={onMouseDown}>
        {bezier ? (
          <g>
            <path
              d={`M${c1.x},${c1.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${c2.x},${c2.y}`}
              stroke="rgb(150, 200, 255)"
              stroke-width={strokeWidth * 3}
              fill="none"
              opacity={highlightOpacity}
            />
            <path
              d={`M${c1.x},${c1.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${c2.x},${c2.y}`}
              stroke={drawColor}
              stroke-width={strokeWidth}
              stroke-dasharray={dashArray}
              fill="none"
            />
          </g>
        ) : (
          <g>
            <line
              x1={c1.x}
              y1={c1.y}
              x2={c2.x}
              y2={c2.y}
              stroke="rgb(150, 200, 255)"
              stroke-width={strokeWidth * 3}
              opacity={highlightOpacity}
            />
            <line
              x1={c1.x}
              y1={c1.y}
              x2={c2.x}
              y2={c2.y}
              stroke={drawColor}
              stroke-width={strokeWidth}
              stroke-dasharray={dashArray}
            />
          </g>
        )}
        {arrowHead !== undefined && (
          <path
            d={`M${arrowHead[0].x},${arrowHead[0].y} L${arrowHead[1].x},${arrowHead[1].y} L${arrowHead[2].x},${arrowHead[2].y}`}
            stroke={drawColor}
            stroke-width={strokeWidth}
            fill="none"
          />
        )}
        {arrowTail !== undefined && (
          <path
            d={`M${arrowTail[0].x},${arrowTail[0].y} L${arrowTail[1].x},${arrowTail[1].y} L${arrowTail[2].x},${arrowTail[2].y}`}
            stroke={drawColor}
            stroke-width={strokeWidth}
            fill="none"
          />
        )}
      </g>
      {selected && (
        <g>
          <circle
            cx={nodeCoord1.x}
            cy={nodeCoord1.y}
            r={cpDist}
            fill="none"
            stroke={controlColor2}
            stroke-width={2}
          />
          <line
            x1={nodeCoord1.x}
            y1={nodeCoord1.y}
            x2={cp1.x}
            y2={cp1.y}
            stroke={controlColor1}
            stroke-width={2}
          />
          <circle
            cx={cp1.x}
            cy={cp1.y}
            r={0.1 * sceneCoords.scale}
            fill="rgba(255, 255, 255, 0.8)"
            stroke={controlColor1}
            stroke-width={2}
            onMouseDown={() => onControlPointMouseDown?.(1)}
          />
          <circle
            cx={nodeCoord2.x}
            cy={nodeCoord2.y}
            r={cpDist}
            fill="none"
            stroke={controlColor2}
            stroke-width={2}
          />
          <line
            x1={nodeCoord2.x}
            y1={nodeCoord2.y}
            x2={cp2.x}
            y2={cp2.y}
            stroke={controlColor1}
            stroke-width={2}
          />
          <circle
            cx={cp2.x}
            cy={cp2.y}
            r={0.1 * sceneCoords.scale}
            fill="rgba(255, 255, 255, 0.8)"
            stroke={controlColor1}
            stroke-width={2}
            onMouseDown={() => onControlPointMouseDown?.(2)}
          />
        </g>
      )}
    </g>
  );
};

export default Edge;
