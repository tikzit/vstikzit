import { useEffect, useRef, useState } from "react";
import { NodeData, StyleData } from "../data/Data";
import SceneCoords from "./SceneCoords";
import { formatLabel } from "./labels";
import { colorToHex } from "./color";

interface NodeProps {
  data: NodeData;
  style: StyleData;
  selected: boolean;
  onMouseDown: (id: number) => void;
  sceneCoords: SceneCoords;
}

const Node = ({ data, style, selected, onMouseDown, sceneCoords }: NodeProps) => {
  const coord = sceneCoords.coordToScreen(data.coord);
  const r = sceneCoords.scale * 0.2;

  const labelRef = useRef<SVGTextElement>(null);
  const [labelWidth, setLabelWidth] = useState<number>(0);

  const fillColor = colorToHex(style.property("tikzit fill") ?? style.property("fill")) ?? "white";
  const drawColor = colorToHex(style.property("tikzit draw") ?? style.property("draw")) ?? "black";
  useEffect(() => {
    setLabelWidth(labelRef.current?.getComputedTextLength() ?? 0);
  }, [data, labelRef]);

  return (
    <g
      id={`node-${data.id}`}
      transform={`translate(${coord.x}, ${coord.y})`}
      onMouseDown={() => onMouseDown(data.id)}
    >
      {style.isNone ? (
        <g>
          <circle r={sceneCoords.scale * 0.035} fill="#aaa" />
          <circle
            r={r}
            fill="none"
            stroke="#aaa"
            strokeDasharray="4 4"
            strokeWidth={sceneCoords.scale * 0.035}
          />
        </g>
      ) : (
        <circle r={r} fill={fillColor} stroke={drawColor} strokeWidth={2} />
      )}
      {data.label !== "" && (
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
      )}
      {selected && <circle r={r + 4} fill="rgba(150, 200, 255, 0.4)" />}
    </g>
  );
};

export default Node;
