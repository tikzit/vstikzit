import { GraphTool } from "./GraphEditor";
import selectIcon from "../../images/tikzit-tool-select.svg";
import nodeIcon from "../../images/tikzit-tool-node.svg";
import edgeIcon from "../../images/tikzit-tool-edge.svg";
import refreshIcon from "../../images/refresh.svg";

interface ToolbarProps {
  tool: GraphTool;
  onToolChanged: (tool: GraphTool) => void;
  onRefreshClicked: () => void;
}

const Toolbar = ({ tool, onToolChanged, onRefreshClicked }: ToolbarProps) => {
  const toolbarButtonStyle = (isSelected: boolean) => ({
    padding: "8px",
    margin: "2px",
    border: isSelected ? "2px solid #8839ef" : "1px solid #ccc",
    backgroundColor: isSelected ? "#eee" : "#fff",
    cursor: "pointer",
    borderRadius: "4px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    boxShadow: isSelected ? "0 0 4px rgba(0, 122, 204, 0.3)" : "none",
  });

  const iconStyle = { width: "20px", height: "20px" };

  return (
    <div style={{ width: "100%" }}>
      <button
        onClick={() => onToolChanged("select")}
        style={toolbarButtonStyle(tool === "select")}
        title="Select Tool"
      >
        <img src={selectIcon} alt="Select" style={iconStyle} />
      </button>
      <button
        onClick={() => onToolChanged("vertex")}
        style={toolbarButtonStyle(tool === "vertex")}
        title="Node Tool"
      >
        <img src={nodeIcon} alt="Node" style={iconStyle} />
      </button>
      <button
        onClick={() => onToolChanged("edge")}
        style={toolbarButtonStyle(tool === "edge")}
        title="Edge Tool"
      >
        <img src={edgeIcon} alt="Edge" style={iconStyle} />
      </button>
      <button style={toolbarButtonStyle(false)} title="Refresh Styles" onClick={onRefreshClicked}>
        <img src={refreshIcon} alt="Refresh" style={iconStyle} />
      </button>
    </div>
  );
};

export default Toolbar;
