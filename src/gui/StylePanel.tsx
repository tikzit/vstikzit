import React, { useState, useEffect } from "react";
import Styles from "../data/Styles";
import { parseTikzStyles } from "../data/TikzParser";
import { GraphTool } from "./GraphEditor";

// Import SVG icons
import selectIcon from "../../images/tikzit-tool-select.svg";
import nodeIcon from "../../images/tikzit-tool-node.svg";
import edgeIcon from "../../images/tikzit-tool-edge.svg";

interface StylePanelProps {
  tool: GraphTool;
  onToolChanged: (tool: GraphTool) => void;
  tikzStyles: Styles;
}

const StylePanel = ({ tool, onToolChanged, tikzStyles }: StylePanelProps) => {
  const toolbarButtonStyle = (isSelected: boolean) => ({
    padding: "8px",
    margin: "2px",
    border: isSelected ? "2px solid #007acc" : "1px solid #ccc",
    backgroundColor: isSelected ? "#e6f3ff" : "#fff",
    cursor: "pointer",
    borderRadius: "4px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "36px",
    height: "36px",
    boxShadow: isSelected ? "0 0 4px rgba(0, 122, 204, 0.3)" : "none",
  });

  const iconStyle = {
    width: "20px",
    height: "20px",
  };

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
      <div style={{ display: "flex", gap: "4px", marginBottom: "10px" }}>
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
      </div>
      <i>[{tikzStyles.filename !== "" ? tikzStyles.filename : "no tikzstyles"}]</i>
      <pre
        style={{
          margin: 0,
          fontFamily: "monospace",
          fontSize: "12px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {tikzStyles.numStyles()} parsed successfully
      </pre>
    </div>
  );
};

export default StylePanel;
