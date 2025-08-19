import { NodeData } from "../data/Data";
import SceneCoords from "./SceneCoords";

interface NodeProps {
  data: NodeData;
  sceneCoords: SceneCoords;
}

const Node = ({ data, sceneCoords }: NodeProps) => {
  const coord = sceneCoords.coordToScreen(data.coord);
  const r = sceneCoords.scale * 0.2;

  return (
    <g id={`node-${data.id}`} transform={`translate(${coord.x}, ${coord.y})`}>
      <circle r={sceneCoords.scale * 0.035} fill="#aaa" />
      <circle
        r={r}
        fill="none"
        stroke="#aaa"
        strokeDasharray="4 4"
        strokeWidth={sceneCoords.scale * 0.035}
      />
    </g>
  );
};

export default Node;
