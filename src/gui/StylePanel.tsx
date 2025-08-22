import { Coord, EdgeData, NodeData } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import Styles from "../lib/Styles";
import { GraphTool } from "./GraphEditor";
import Toolbar from "./Toolbar";
import Node from "./Node";
import { SVGTextElementAttributes } from "react";
import Edge from "./Edge";

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
  const sceneCoords = new SceneCoords(44, 30);
  const labelProps: any = {
    x: 22,
    y: 38,
    textAnchor: "middle",
    alignmentBaseline: "middle",
    fontSize: "10px",
    fontStyle: "italic",
  };

  // dummy node and edge data used for drawing the controls
  const node = new NodeData();
  const enode1 = new NodeData().setId(0).setCoord(new Coord(-0.25, 0.0));
  const enode2 = new NodeData().setId(1).setCoord(new Coord(0.25, 0.0));
  const edge = new EdgeData().setSource(0).setTarget(1);

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
          {tikzStyles.styleData.entrySeq().map(([name, style]) => {
            if (style.isEdgeStyle) return null;
            const shortName = name.length > 8 ? name.slice(0, 8) + "…" : name;
            return (
              <a href="#" title={name} onClick={() => false} style={{ outline: "none" }}>
                <svg key={name} width={44} height={44} style={{ margin: "5px", borderWidth: 0 }}>
                  <Node data={node} style={style} sceneCoords={sceneCoords} />
                  <text {...labelProps}>{shortName}</text>
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
            if (name !== "none" && !style.isEdgeStyle) return null;
            const shortName = name.length > 8 ? name.slice(0, 8) + "…" : name;
            return (
              <a href="#" title={name} onClick={() => false}>
                <svg key={name} width={44} height={44} style={{ margin: "5px" }}>
                  <Edge
                    data={edge}
                    sourceData={enode1}
                    targetData={enode2}
                    style={style}
                    sceneCoords={sceneCoords}
                  />
                  <text {...labelProps}>{shortName}</text>
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
