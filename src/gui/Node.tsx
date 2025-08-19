import { useEffect, useRef, useState } from "react";
import { NodeData, StyleData } from "../data/Data";
import SceneCoords from "./SceneCoords";
import { formatLabel } from "./labels";

interface NodeProps {
  data: NodeData;
  style: StyleData;
  sceneCoords: SceneCoords;
}

const Node = ({ data, style, sceneCoords }: NodeProps) => {
  const coord = sceneCoords.coordToScreen(data.coord);
  const r = sceneCoords.scale * 0.2;

  const labelRef = useRef<SVGTextElement>(null);
  const [labelWidth, setLabelWidth] = useState<number>(0);

  useEffect(() => {
    setLabelWidth(labelRef.current?.getComputedTextLength() ?? 0);
  }, [data, labelRef]);

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
      {data.label !== "" ? (
        <g>
          <rect
            x={-labelWidth / 2 - 2}
            y={-12}
            width={labelWidth + 4}
            height={24}
            fill="#fe6"
            stroke="#f00"
            strokeDasharray="4 4"
            opacity={0.6}
          />
          <text
            ref={labelRef}
            x={0}
            y={0}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontFamily="monospace"
            fontWeight="bold"
          >
            {formatLabel(data.label)}
          </text>
        </g>
      ) : null}
    </g>
  );
};

export default Node;
