import { EdgeData, NodeData, StyleData } from "../data/Data";
import SceneCoords from "./SceneCoords";

interface EdgeProps {
  data: EdgeData;
  sourceData: NodeData;
  targetData: NodeData;
  style: StyleData;
  sceneCoords: SceneCoords;
}

const Edge = ({ data, sourceData, targetData, sceneCoords }: EdgeProps) => {
  const c1 = sceneCoords.coordToScreen(sourceData.coord);
  const c2 = sceneCoords.coordToScreen(targetData.coord);
  const strokeWidth = sceneCoords.scale * 0.05;

  return <line x1={c1.x} y1={c1.y} x2={c2.x} y2={c2.y} stroke="#000" strokeWidth={strokeWidth} />;
};

export default Edge;
