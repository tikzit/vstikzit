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
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Toolbar tool={tool} onToolChanged={onToolChanged} />
      <i>[{tikzStyles.filename !== "" ? tikzStyles.filename : "no tikzstyles"}]</i>

      <br />

      <div style={{ overflow: "hidden", height: "calc(100% - 64px)", width: "100%" }}>
        <div
          id="node-styles"
          style={{
            height: "calc(50% - 5px)",
            overflowY: "scroll",
            backgroundColor: "#fff",
            color: "#000",
            marginBottom: "10px",
          }}
        >
          <a href="#" title="none" onClick={() => false} style={{ outline: "none" }}>
            <svg width={44} height={44} style={{ margin: "5px", borderWidth: 0 }}>
              <g>
                <circle cx={22} cy={15} r={2.2} fill="#aaa" />
                <circle
                  cx={22}
                  cy={15}
                  r={12}
                  fill="rgba(0,0,0,0)"
                  stroke="#aaa"
                  strokeDasharray="4 4"
                  strokeWidth={2.2}
                />
              </g>
              <text
                x={22}
                y={38}
                textAnchor="middle"
                alignmentBaseline="middle"
                fontSize="10px"
                fontStyle="italic"
              >
                none
              </text>
            </svg>
          </a>
          {tikzStyles.styleData.entrySeq().map(([name, style]) => {
            if (style.isEdgeStyle) {
              return null;
            }
            const fill = colorToHex(
              style.property("tikzit fill") ?? style.property("fill") ?? "white"
            );
            const draw = colorToHex(
              style.property("tikzit draw") ?? style.property("draw") ?? "black"
            );
            const shortName = name.length > 8 ? name.slice(0, 8) + "…" : name;
            return (
              <a href="#" title={name} onClick={() => false} style={{ outline: "none" }}>
                <svg key={name} width={44} height={44} style={{ margin: "5px", borderWidth: 0 }}>
                  <circle cx={22} cy={15} r={12} fill={fill} stroke={draw} strokeWidth={2} />
                  <text
                    x={22}
                    y={38}
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
        <div
          id="edge-styles"
          style={{
            height: "calc(50% - 5px)",
            overflowY: "scroll",
            backgroundColor: "#fff",
            color: "#000",
          }}
        >
          {tikzStyles.styleData.entrySeq().map(([name, style]) => {
            if (!style.isEdgeStyle) {
              return null;
            }
            const fill = colorToHex(
              style.property("tikzit fill") ?? style.property("fill") ?? "white"
            );
            const draw = colorToHex(
              style.property("tikzit draw") ?? style.property("draw") ?? "black"
            );
            const shortName = name.length > 8 ? name.slice(0, 8) + "…" : name;
            return (
              <a href="#" title={name} onClick={() => false}>
                <svg key={name} width={44} height={44} style={{ margin: "5px" }}>
                  <circle cx={22} cy={15} r={12} fill={fill} stroke={draw} strokeWidth={2} />
                  <text
                    x={22}
                    y={38}
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
    </div>
  );
};

export default StylePanel;
