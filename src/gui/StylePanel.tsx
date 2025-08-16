import React, { useState, useEffect } from "react";
import Styles from "../data/Styles";
import { parseTikzStyles } from "../data/TikzParser";

interface StylePanelProps {
  vscode: any;
}

const StylePanel = ({ vscode }: StylePanelProps) => {
  const [styles, setStyles] = useState<Styles>(new Styles());
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (message.type === "tikzStylesContent") {
        setLoading(false);
        if (message.content) {
          const parsed = parseTikzStyles(message.content);
          if (parsed.result === undefined) {
            setFilename(null);
            setStyles(new Styles());
            setError(
              parsed.errors.map(err => `${err.line} (${err.column}): ${err.message}`).join("; ")
            );
          } else {
            setFilename(message.filename);
            setStyles(parsed.result);
            setError(null);
          }
        } else {
          setStyles(new Styles());
          setFilename(null);
          setError(message.error || "Failed to load .tikzstyles file");
        }
      }
    };

    window.addEventListener("message", handleMessage);

    // Request tikzstyles content when component mounts
    vscode.postMessage({
      type: "getTikzStyles",
    });

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "10px", backgroundColor: "#fff", color: "#000" }}>
        <i>Loading .tikzstyles...</i>
      </div>
    );
  }

  if (error !== null) {
    return (
      <div style={{ padding: "10px", backgroundColor: "#fff", color: "#000" }}>
        <i>[no .tikzstyles]</i>
        {error && <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>{error}</div>}
      </div>
    );
  }

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
      <i>[{filename}]</i>
      <pre
        style={{
          margin: 0,
          fontFamily: "monospace",
          fontSize: "12px",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
        }}
      >
        {styles.numStyles()} parsed successfully
      </pre>
    </div>
  );
};

export default StylePanel;
