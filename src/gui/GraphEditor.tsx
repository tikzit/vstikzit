import { useEffect, useState } from "react";
import Graph from "../data/Graph";
import { drawGrid } from "./grid";
import SceneCoords from "./SceneCoords";
import Node from "./Node";
import Edge from "./Edge";
import Styles from "../data/Styles";

interface GraphEditorProps {
  initGraph: Graph;
  onGraphChange: (graph: Graph) => void;
  tikzStyles: Styles;
}

const GraphEditor = ({ initGraph, onGraphChange, tikzStyles }: GraphEditorProps) => {
  const sceneCoords = new SceneCoords(5000, 5000);
  const [graph, setGraph] = useState<Graph>(initGraph);

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
        <g id="edges">
          {graph.paths.map(path =>
            graph.pathData.get(path)?.edges.map(edge => {
              const d = graph.edgeData.get(edge)!;
              return (
                <Edge
                  key={edge}
                  data={d}
                  sourceData={graph.nodeData.get(d.source)!}
                  targetData={graph.nodeData.get(d.target)!}
                  sceneCoords={sceneCoords}
                />
              );
            })
          )}
        </g>
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
