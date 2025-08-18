import { EdgeData, NodeData } from "../data/Data";
import SceneCoords from "./SceneCoords";

interface EdgeProps {
  data: EdgeData;
  sourceData: NodeData;
  targetData: NodeData;
  sceneCoords: SceneCoords;
}

const Edge = ({ data, sourceData, targetData, sceneCoords }: EdgeProps) => {
  const [x1, y1] = sceneCoords.coordToScreen(sourceData.coord);
  const [x2, y2] = sceneCoords.coordToScreen(targetData.coord);
  const strokeWidth = sceneCoords.scale * 0.05;

  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#000" strokeWidth={strokeWidth} />;
};

export default Edge;
