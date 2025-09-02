import { Coord, EdgeData, NodeData } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import Styles from "../lib/Styles";
import Node from "./Node";
import Edge from "./Edge";
import { isValidDelimString } from "../lib/TikzParser";
import { SVGProps } from "react";

interface StylePanelProps {
  tikzStyles: Styles;
  currentNodeLabel: string | undefined;
  currentNodeStyle: string;
  currentEdgeStyle: string;
  onCurrentNodeLabelChanged: (label: string) => void;
  onNodeStyleChanged: (style: string, apply: boolean) => void;
  onEdgeStyleChanged: (style: string, apply: boolean) => void;
}

const StylePanel = ({
  tikzStyles,
  currentNodeLabel,
  currentNodeStyle,
  currentEdgeStyle,
  onCurrentNodeLabelChanged: setCurrentNodeLabel,
  onNodeStyleChanged: setNodeStyle,
  onEdgeStyleChanged: setEdgeStyle,
}: StylePanelProps) => {
  const sceneCoords = new SceneCoords(44, 32);
  const labelProps: SVGProps<SVGTextElement> = {
    x: 22,
    y: 38,
    textAnchor: "middle",
    alignmentBaseline: "middle",
    fontSize: "10px",
    fontStyle: "italic",
  };
  const selectionProps = {
    x: 1,
    y: 1,
    width: 43,
    height: 43,
    fill: "rgba(150, 200, 255, 0.4)",
    stroke: "rgba(150, 200, 255, 0.8)",
    strokeWidth: 1,
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
      <div
        style={{ marginBottom: "2px", marginTop: "2px", marginLeft: "0px", marginRight: "15px" }}
      >
        <input
          id="label-field"
          value={currentNodeLabel ?? ""}
          onChange={e => setCurrentNodeLabel(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              document.getElementById("graph-editor")?.focus();
            }
          }}
          disabled={currentNodeLabel === undefined}
          className={isValidDelimString("{" + currentNodeLabel + "}") ? "" : "error"}
        />
      </div>

      <i>[{tikzStyles.filename !== "" ? tikzStyles.filename : "no tikzstyles"}]</i>
      <div style={{ overflow: "hidden", height: "calc(100% - 80px)", width: "100%" }}>
        <div
          id="node-styles"
          style={{
            height: "calc(70% - 5px)",
            overflowY: "scroll",
            backgroundColor: "#fff",
            color: "#000",
            marginBottom: "10px",
          }}
        >
          {tikzStyles.styleData.entrySeq().map(([name, style]) => {
            if (style.isEdgeStyle) {
              return null;
            }
            const shortName = name.length > 8 ? name.slice(0, 8) + "…" : name;
            return (
              <a
                key={name}
                href="#"
                draggable="false"
                title={name}
                onClick={e => setNodeStyle(name, e.detail > 1)}
                style={{ outline: "none" }}
              >
                <svg width={44} height={44} style={{ margin: "5px", borderWidth: 0 }}>
                  {currentNodeStyle === name && <rect {...selectionProps} />}
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
            height: "calc(30% - 5px)",
            overflowY: "scroll",
            backgroundColor: "#fff",
            color: "#000",
          }}
        >
          {tikzStyles.styleData.entrySeq().map(([name, style]) => {
            if (name !== "none" && !style.isEdgeStyle) {
              return null;
            }
            const shortName = name.length > 8 ? name.slice(0, 8) + "…" : name;
            return (
              <a
                key={name}
                href="#"
                draggable="false"
                title={name}
                onClick={e => setEdgeStyle(name, e.detail > 1)}
                style={{ outline: "none" }}
              >
                <svg width={44} height={44} style={{ margin: "5px" }}>
                  {currentEdgeStyle === name && <rect {...selectionProps} />}
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
