import { useEffect, useState } from "react";
import Graph from "../data/Graph";
import { drawGrid } from "./grid";
import SceneCoords from "./SceneCoords";
import Node from "./Node";
import Edge from "./Edge";
import Styles from "../data/Styles";
import { StyleData } from "../data/Data";

interface GraphEditorProps {
  graph: Graph;
  onGraphChange: (graph: Graph) => void;
  tikzStyles: Styles;
}

const GraphEditor = ({ graph, onGraphChange, tikzStyles }: GraphEditorProps) => {
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
        <g id="edges">
          {graph.edgeData.map(data => {
            const style = tikzStyles.style(data.property("style") ?? "") ?? new StyleData();
            return (
              <Edge
                key={data.id}
                data={data}
                sourceData={graph.nodeData.get(data.source)!}
                targetData={graph.nodeData.get(data.target)!}
                style={style}
                sceneCoords={sceneCoords}
              />
            );
          })}
        </g>
        <g id="nodes">
          {graph.nodeData.map(data => {
            const style = tikzStyles.style(data.property("style") ?? "") ?? new StyleData();
            return <Node key={data.id} data={data} style={style} sceneCoords={sceneCoords} />;
          })}
        </g>
      </svg>
    </div>
  );
};

export default GraphEditor;
