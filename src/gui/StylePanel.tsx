import React, { useState, useEffect } from "react";
import Styles from "../data/Styles";
import { parseTikzStyles } from "../data/TikzParser";

interface StylePanelProps {
  tikzStyles: Styles;
}

const StylePanel = ({ tikzStyles }: StylePanelProps) => {
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
