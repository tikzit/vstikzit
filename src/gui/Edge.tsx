import { useMemo } from "react";
import { Coord, EdgeData, NodeData } from "../lib/Data";
import { StyleData } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import { colorToHex } from "../lib/color";
import { computeControlPoints, tangent } from "../lib/curve";

interface EdgeProps {
  data: EdgeData;
  sourceData: NodeData;
  targetData: NodeData;
  style: StyleData;
  selected?: boolean;
  onMouseDown?: () => void;
  onControlPointMouseDown?: (cp: 1 | 2) => void;
  sceneCoords: SceneCoords;
}

const Edge = ({
  data,
  sourceData,
  targetData,
  style,
  selected,
  onMouseDown,
  onControlPointMouseDown,
  sceneCoords,
}: EdgeProps) => {
  const [c1, c2, cp1, cp2, arrowHead, arrowTail] = useMemo(() => {
    const [c1, c2, cp1, cp2] = computeControlPoints(sourceData, targetData, data);
    const tt = tangent([c1, c2, cp1, cp2], 0.0, 0.1);
    const ht = tangent([c1, c2, cp1, cp2], 1.0, 0.9);

    let arrowHead: Coord[] | undefined = undefined;
    if (style.arrowHead === "flat") {
      arrowHead = [c2.shift(-ht.y, ht.x), c2, c2.shift(ht.y, -ht.x)];
    } else if (style.arrowHead === "pointer") {
      arrowHead = [c2.shift(ht.x - ht.y, ht.x + ht.y), c2, c2.shift(ht.x + ht.y, -ht.x + ht.y)];
    }

    let arrowTail: Coord[] | undefined = undefined;
    if (style.arrowTail === "flat") {
      arrowTail = [c1.shift(-tt.y, tt.x), c1, c1.shift(tt.y, -tt.x)];
    } else if (style.arrowTail === "pointer") {
      arrowTail = [c1.shift(tt.x - tt.y, tt.x + tt.y), c1, c1.shift(tt.x + tt.y, -tt.x + tt.y)];
    }

    console.log("arrowHead", style.arrowHead, arrowHead);
    console.log("arrowTail", style.arrowTail, arrowTail);

    return [
      sceneCoords.coordToScreen(c1),
      sceneCoords.coordToScreen(c2),
      cp1 ? sceneCoords.coordToScreen(cp1) : undefined,
      cp2 ? sceneCoords.coordToScreen(cp2) : undefined,
      arrowHead !== undefined ? arrowHead?.map(sceneCoords.coordToScreen) : undefined,
      arrowTail !== undefined ? arrowTail?.map(sceneCoords.coordToScreen) : undefined,
    ];
  }, [data, sourceData, targetData]);

  const strokeWidth = sceneCoords.scale * 0.05;
  const drawColor = colorToHex(style.property("tikzit draw") ?? style.property("draw")) ?? "black";

  return (
    <g>
      {cp1 !== undefined && cp2 !== undefined ? (
        <path
          d={`M${c1.x},${c1.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${c2.x},${c2.y}`}
          stroke={drawColor}
          strokeWidth={strokeWidth}
          fill="none"
          onMouseDown={onMouseDown}
        />
      ) : (
        <line
          x1={c1.x}
          y1={c1.y}
          x2={c2.x}
          y2={c2.y}
          stroke={drawColor}
          strokeWidth={strokeWidth}
        />
      )}
      {arrowHead !== undefined && (
        <path
          d={`M${arrowHead[0].x},${arrowHead[0].y} L${arrowHead[1].x},${arrowHead[1].y} L${arrowHead[2].x},${arrowHead[2].y}`}
          stroke={drawColor}
        />
      )}
      {arrowTail !== undefined && (
        <path
          d={`M${arrowTail[0].x},${arrowTail[0].y} L${arrowTail[1].x},${arrowTail[1].y} L${arrowTail[2].x},${arrowTail[2].y}`}
          stroke={drawColor}
        />
      )}
    </g>
  );
};

export default Edge;
