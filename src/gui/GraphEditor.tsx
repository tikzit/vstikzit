import { useEffect } from "react";
import Graph from "../data/Graph";
import { drawGrid } from "./grid";
import SceneCoords from "./SceneCoords";
import Node from "./Node";

interface GraphEditorProps {
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
}

const GraphEditor = ({ graph, onGraphChange }: GraphEditorProps) => {
  const sceneCoords = new SceneCoords(5000, 5000);

  useEffect(() => {
    const graphEditor = document.getElementById("graph-editor-viewport")!;
    graphEditor.scrollLeft = Math.max(0, (sceneCoords.width - graphEditor.clientWidth) / 2);
    graphEditor.scrollTop = Math.max(0, (sceneCoords.height - graphEditor.clientHeight) / 2);
  }, []);

  useEffect(() => {
    const svg = document.getElementById("graph-editor");
    if (svg !== null) {
      drawGrid(svg, sceneCoords);
    }
  }, []);

  return (
    <div
      id="graph-editor-viewport"
      style={{ height: "100%", padding: "10px", overflow: "auto", tabSize: 4 }}
    >
      <svg
        id="graph-editor"
        style={{
          height: `${sceneCoords.height}px`,
          width: `${sceneCoords.width}px`,
          backgroundColor: "white",
        }}
      >
        <g id="grid"></g>
        <g id="nodes">
          {graph.nodes.map(node => (
            <Node key={node} data={graph.nodeData.get(node)!} sceneCoords={sceneCoords} />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default GraphEditor;
