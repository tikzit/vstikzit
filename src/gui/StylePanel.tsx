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
    </div>
  );
};

export default StylePanel;
