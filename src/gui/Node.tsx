import { useEffect, useRef, useState } from "preact/hooks";
import { NodeData, StyleData } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import { formatLabel } from "../lib/labels";
import { colorToHex } from "../lib/color";
import Styles from "../lib/Styles";

interface NodeProps {
  data: NodeData;
  tikzStyles: Styles;
  selected?: boolean;
  highlight?: boolean;
  onMouseDown?: () => void;
  sceneCoords: SceneCoords;
}

const Node = ({ data, tikzStyles, selected, highlight, onMouseDown, sceneCoords }: NodeProps) => {
  const style = tikzStyles.style(data.property("style"));
  const coord = sceneCoords.coordToScreen(data.coord);
  const r = sceneCoords.scale * 0.2;

  const labelRef = useRef<SVGTextElement>(null);
  const [labelWidth, setLabelWidth] = useState<number>(0);

  const shape = style.property("tikzit shape") ?? style.property("shape") ?? "circle";
  const fillColor = colorToHex(style.property("tikzit fill") ?? style.property("fill")) ?? "white";
  const drawColor = colorToHex(style.property("tikzit draw") ?? style.property("draw")) ?? "black";
  useEffect(() => {
    setLabelWidth(labelRef.current?.getComputedTextLength() ?? 0);
  }, [data, labelRef]);

  return (
    <g
      id={`node-${data.id}`}
      transform={`translate(${coord.x}, ${coord.y})`}
      onMouseDown={onMouseDown}
    >
      {style.isNone ? (
        <g>
          <circle r={sceneCoords.scale * 0.035} fill="#aaa" />
          <circle
            r={r}
            fill="rgba(0,0,0,0)"
            stroke="#aaa"
            stroke-dasharray="4 4"
            stroke-width={sceneCoords.scale * 0.035}
          />
        </g>
      ) : shape === "rectangle" ? (
        <rect
          x={-r}
          y={-r}
          width={2 * r}
          height={2 * r}
          fill={fillColor}
          stroke={drawColor}
          stroke-width={sceneCoords.scale * 0.025}
        />
      ) : (
        <circle r={r} fill={fillColor} stroke={drawColor} stroke-width={sceneCoords.scale * 0.025} />
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
            stroke-dasharray="4 4"
            opacity={0.6}
          />
          <text
            ref={labelRef}
            x={0}
            y={0}
            text-anchor="middle"
            alignment-baseline="middle"
            font-family="monospace"
            font-weight="bold"
            style={{ cursor: "default" }}
          >
            {formatLabel(data.label)}
          </text>
        </g>
      )}
      {selected && <circle r={r + 4} fill="rgba(150, 200, 255, 0.4)" />}
      {highlight && <circle r={r} stroke="rgb(100, 0, 200)" fill="none" stroke-width={4} />}
    </g>
  );
};

export default Node;
