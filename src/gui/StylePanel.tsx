import { Coord, EdgeData, NodeData } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import Styles from "../lib/Styles";
import Node from "./Node";
import Edge from "./Edge";
import { isValidDelimString } from "../lib/TikzParser";
import { JSX } from "preact";

interface StylePanelProps {
  tikzStyles: Styles;
  editMode: boolean;
  error: boolean;
  currentNodeStyle: string | undefined;
  currentEdgeStyle: string | undefined;
  onNodeStyleChanged: (style: string, apply: boolean) => void;
  onEdgeStyleChanged: (style: string, apply: boolean) => void;
  currentNodeLabel?: string | undefined;
  onCurrentNodeLabelChanged?: (label: string) => void;
  onEditStyles?: (e: Event) => void;
  onRefreshStyles?: (e: Event) => void;
}

const StylePanel = ({
  tikzStyles,
  editMode,
  error,
  currentNodeStyle,
  currentEdgeStyle,
  onNodeStyleChanged: setNodeStyle,
  onEdgeStyleChanged: setEdgeStyle,
  currentNodeLabel,
  onCurrentNodeLabelChanged: setCurrentNodeLabel,
  onEditStyles,
  onRefreshStyles,
}: StylePanelProps) => {
  const sceneCoords = new SceneCoords()
    .setZoom(0)
    .setLeft(0.35)
    .setRight(0.35)
    .setUp(0.25)
    .setDown(0.25);
  const labelProps: JSX.SVGAttributes<SVGTextElement> = {
    x: 22,
    y: 38,
    "text-anchor": "middle",
    "alignment-baseline": "middle",
    "font-size": "10px",
    "font-style": "italic",
  };
  const selectionProps = {
    x: 1,
    y: 1,
    width: 43,
    height: 43,
    fill: "rgba(150, 200, 255, 0.4)",
    stroke: "rgba(150, 200, 255, 0.8)",
    "stroke-width": 1,
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
      {!editMode && (
        <>
          <div
            style={{
              marginBottom: "2px",
              marginTop: "2px",
              marginLeft: "0px",
              marginRight: "15px",
            }}
          >
            <input
              id="label-field"
              style={{ width: "80%" }}
              value={currentNodeLabel ?? ""}
              onInput={e =>
                setCurrentNodeLabel !== undefined &&
                setCurrentNodeLabel((e.target as HTMLInputElement).value)
              }
              onKeyDown={e => {
                if (e.key === "Enter") {
                  document.getElementById("graph-editor")?.focus();
                }
              }}
              disabled={currentNodeLabel === undefined}
              className={isValidDelimString("{" + currentNodeLabel + "}") ? "" : "error"}
            />
          </div>
          <div class="style-info" style={{ marginBottom: "10px", marginTop: "10px" }}>
            <i style={{ color: error ? "var(--tikzit-errorForeground)" : "inherit" }}>
              [{tikzStyles.filename !== "" ? tikzStyles.filename : "no tikzstyles"}]
            </i>
            <a href="#" title="Edit styles" onClick={onEditStyles}>
              &#9998;
            </a>
            <a href="#" title="Refresh styles" onClick={onRefreshStyles}>
              &#10227;
            </a>
          </div>
        </>
      )}

      <div
        style={{
          overflow: "hidden",
          height: editMode ? "calc(100% - 30px)" : "calc(100% - 100px)",
          width: "100%",
        }}
      >
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
          {tikzStyles.styles.map(style => {
            if (style.isEdgeStyle || (editMode && style.name === "none")) {
              return null;
            }
            const shortName = style.name.length > 8 ? style.name.slice(0, 8) + "…" : style.name;
            return (
              <a
                key={style.name}
                href="#"
                draggable={false}
                title={style.name}
                onClick={e => setNodeStyle(style.name, e.detail > 1)}
                style={{ outline: "none" }}
              >
                <svg
                  width={sceneCoords.screenWidth}
                  height={sceneCoords.screenHeight + 12}
                  style={{ margin: "5px", borderWidth: 0 }}
                >
                  {currentNodeStyle === style.name && <rect {...selectionProps} />}
                  <Node
                    data={node.setProperty("style", style.name)}
                    tikzStyles={tikzStyles}
                    sceneCoords={sceneCoords}
                  />
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
          {tikzStyles.styles.map(style => {
            if (
              (style.name !== "none" && !style.isEdgeStyle) ||
              (editMode && style.name === "none")
            ) {
              return null;
            }
            const shortName = style.name.length > 8 ? style.name.slice(0, 8) + "…" : style.name;
            return (
              <a
                key={style.name}
                href="#"
                draggable={false}
                title={style.name}
                onClick={e => setEdgeStyle(style.name, e.detail > 1)}
                style={{ outline: "none" }}
              >
                <svg
                  width={sceneCoords.screenWidth}
                  height={sceneCoords.screenHeight + 12}
                  style={{ margin: "5px" }}
                >
                  {currentEdgeStyle === style.name && <rect {...selectionProps} />}
                  <Edge
                    data={edge.setProperty("style", style.name)}
                    sourceData={enode1}
                    targetData={enode2}
                    tikzStyles={tikzStyles}
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
