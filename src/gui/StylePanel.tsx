import { Coord, EdgeData, NodeData } from "../lib/Data";
import SceneCoords from "../lib/SceneCoords";
import Styles from "../lib/Styles";
import Node from "./Node";
import Edge from "./Edge";
import { isValidDelimString, parseTikzStyles } from "../lib/TikzParser";
import { JSX } from "preact";
import TikzitHost from "../lib/TikzitHost";
import { useEffect, useReducer, useState } from "preact/hooks";
import { parse } from "path";

interface StylePanelState {
  nodeStyle?: string;
  edgeStyle?: string;
  nodeLabel?: string | null;
  editMode?: boolean;
  error?: boolean;
  styleSource?: string;
  styleFilename?: string;
  apply?: boolean;
}

interface StylePanelProps {
  host: TikzitHost;
}

const StylePanel = ({ host }: StylePanelProps) => {
  const [state, updateState] = useReducer(
    (s: StylePanelState, message: StylePanelState) => ({ ...s, ...message }),
    {}
  );

  const [tikzStyles, setTikzStyles] = useState<Styles>(new Styles());

  useEffect(() => {
    host.updateStylePanel();
  }, [host]);

  useEffect(() => {
    host.onMessageToStylePanel(message => {
      const newState = { ...message };
      if (message.styleSource !== undefined) {
        const parsed = parseTikzStyles(message.styleSource);
        if (parsed.result !== undefined) {
          setTikzStyles(parsed.result.setFilename(message.styleFilename ?? ""));
          newState.error = false;
        } else {
          newState.error = true;
        }
      }
      updateState(newState);
    });
  }, [host, updateState]);

  const update = (message: StylePanelState) => {
    updateState(message);
    host.messageFromStylePanel(message);
  };

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
      {!state.editMode && (
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
              value={state.nodeLabel ?? ""}
              onInput={e => update({ nodeLabel: (e.target as HTMLInputElement).value })}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  document.getElementById("graph-editor")?.focus();
                }
              }}
              disabled={state.nodeLabel === null}
              className={isValidDelimString("{" + state.nodeLabel + "}") ? "" : "error"}
            />
          </div>
          <div class="style-info">
            <a
              href="#"
              title="Edit styles"
              onClick={e => {
                e.preventDefault();
                host.openTikzStyles();
              }}
            >
              &#9998;
            </a>
            <a
              href="#"
              title="Refresh styles"
              onClick={e => {
                e.preventDefault();
                host.refreshTikzStyles();
              }}
            >
              &#10227;
            </a>
            <span style={{ color: state.error ? "var(--tikzit-errorForeground)" : "inherit" }}>
              [{tikzStyles.filename !== "" ? tikzStyles.filename : "no tikzstyles"}]
            </span>
          </div>
        </>
      )}

      <div
        style={{
          overflow: "hidden",
          height: state.editMode ? "calc(100% - 30px)" : "calc(100% - 100px)",
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
            if (style.isEdgeStyle || (state.editMode && style.name === "none")) {
              return null;
            }
            const shortName = style.name.length > 8 ? style.name.slice(0, 8) + "…" : style.name;
            return (
              <a
                key={style.name}
                href="#"
                draggable={false}
                title={style.name}
                onClick={e => update({ nodeStyle: style.name, apply: e.detail > 1 })}
                style={{ outline: "none" }}
              >
                <svg
                  width={sceneCoords.screenWidth}
                  height={sceneCoords.screenHeight + 12}
                  style={{ margin: "5px", borderWidth: 0 }}
                >
                  {state.nodeStyle === style.name && <rect {...selectionProps} />}
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
              (state.editMode && style.name === "none")
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
                onClick={e => update({ edgeStyle: style.name, apply: e.detail > 1 })}
                style={{ outline: "none" }}
              >
                <svg
                  width={sceneCoords.screenWidth}
                  height={sceneCoords.screenHeight + 12}
                  style={{ margin: "5px" }}
                >
                  {state.edgeStyle === style.name && <rect {...selectionProps} />}
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
export { StylePanelState };
