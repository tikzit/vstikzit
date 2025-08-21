import { colorToHex } from "../lib/color";
import Styles from "../lib/Styles";
import { GraphTool } from "./GraphEditor";
import Toolbar from "./Toolbar";

interface StylePanelProps {
  tool: GraphTool;
  onToolChanged: (tool: GraphTool) => void;
  tikzStyles: Styles;
  currentNodeStyle: string;
  currentEdgeStyle: string;
}

const StylePanel = ({
  tool,
  onToolChanged,
  tikzStyles,
  currentNodeStyle,
  currentEdgeStyle,
}: StylePanelProps) => {
  return (
    <div
      style={{
        padding: "10px",
        backgroundColor: "#fff",
        color: "#000",
        height: "100%",
        overflow: "auto",
      }}
    >
      <Toolbar tool={tool} onToolChanged={onToolChanged} />
      <i>[{tikzStyles.filename !== "" ? tikzStyles.filename : "no tikzstyles"}]</i>

      <br />

      <div style={{ overflow: "auto" }}>
        {tikzStyles.styleData.entrySeq().map(([name, style]) => {
          const fill = colorToHex(
            style.property("tikzit fill") ?? style.property("fill") ?? "white"
          );
          const draw = colorToHex(
            style.property("tikzit draw") ?? style.property("draw") ?? "black"
          );
          const shortName = name.length > 10 ? name.slice(0, 10) + "…" : name;
          return (
            <a href="#" title={name} onClick={() => false}>
              <svg key={name} width={50} height={50} style={{ margin: "5px" }}>
                <circle cx={25} cy={15} r={12} fill={fill} stroke={draw} strokeWidth={2} />
                <text
                  x={25}
                  y={43}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fontSize="10px"
                  fontStyle="italic"
                >
                  {shortName}
                </text>
              </svg>
            </a>
          );
        })}
      </div>
    </div>
  );
};

export default StylePanel;
