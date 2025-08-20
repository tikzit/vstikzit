import { useMemo } from "react";
import { EdgeData, NodeData, StyleData } from "../data/Data";
import SceneCoords from "./SceneCoords";
import { colorToHex } from "./color";
import { computeControlPoints } from "./curve";

interface EdgeProps {
  data: EdgeData;
  sourceData: NodeData;
  targetData: NodeData;
  style: StyleData;
  sceneCoords: SceneCoords;
}

const Edge = ({ data, sourceData, targetData, style, sceneCoords }: EdgeProps) => {
  const [c1, c2, cp1, cp2] = useMemo(() => {
    const cs = computeControlPoints(sourceData, targetData, data);
    return [
      sceneCoords.coordToScreen(cs[0]),
      sceneCoords.coordToScreen(cs[1]),
      cs[2] ? sceneCoords.coordToScreen(cs[2]) : undefined,
      cs[3] ? sceneCoords.coordToScreen(cs[3]) : undefined,
    ];
  }, [data, sourceData, targetData]);

  const strokeWidth = sceneCoords.scale * 0.05;
  const drawColor = colorToHex(style.property("tikzit draw") ?? style.property("draw")) ?? "black";

  if (cp1 !== undefined && cp2 !== undefined) {
    return (
      <path
        d={`M${c1.x},${c1.y} C${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${c2.x},${c2.y}`}
        stroke={drawColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
    );
  } else {
    return (
      <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke={drawColor} strokeWidth={strokeWidth} />
    );
  }
};

export default Edge;
