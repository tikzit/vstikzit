import { useMemo } from "react";
import { parseTikzPicture } from "../data/TikzParser";
import Graph from "../data/Graph";

interface GraphEditorProps {
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
}

const GraphEditor = ({ graph, onGraphChange }: GraphEditorProps) => {
  return (
    <div style={{ height: "100%", padding: "10px", overflow: "auto" }}>
      <h3>Graph</h3>

      <pre
        style={{
          padding: "10px",
          fontSize: "12px",
          fontFamily: "monospace",
        }}
      >
        {graph.tikz()}
      </pre>
    </div>
  );
};

export default GraphEditor;
