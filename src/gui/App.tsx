import { Set } from "immutable";
import { useState, useEffect } from "react";
// import Split from "react-split";

import GraphEditor from "./GraphEditor";
import { GraphTool } from "./GraphEditor";
import Graph from "../lib/Graph";
import { isValidDelimString, parseTikzPicture, parseTikzStyles } from "../lib/TikzParser";
import StylePanel from "./StylePanel";
import Styles from "../lib/Styles";
import Toolbar from "./Toolbar";
import Splitpane from "./Splitpane";

interface IContent {
  document: string;
  styleFile: string;
  styles: string;
}

interface AppProps {
  initialContent: IContent;
  vscode: VsCodeApi;
}

const App = ({ initialContent, vscode }: AppProps) => {
  const [tool, setTool] = useState<GraphTool>("select");

  // the current graph being displayed
  const [graph, setGraph] = useState<Graph>(
    parseTikzPicture(initialContent.document).result ?? new Graph()
  );

  const [currentNodeLabel, setCurrentNodeLabel] = useState<string | undefined>(undefined);
  const [currentNodeStyle, setCurrentNodeStyle] = useState<string>("none");
  const [currentEdgeStyle, setCurrentEdgeStyle] = useState<string>("none");

  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(Set());
  const [selectedEdges, setSelectedEdges] = useState<Set<number>>(Set());

  const [tikzStyles, setTikzStyles] = useState<Styles>(
    (parseTikzStyles(initialContent.styles).result ?? new Styles()).setFilename(
      initialContent.styleFile
    )
  );

  useEffect(() => {
    // setupCodeEditor(vscode);

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "updateToGui":
          if (message.content) {
            // console.log("got update from vscode");
            tryParseGraph(message.content);
          }
          break;
        case "tikzStylesContent":
          if (message.content) {
            console.log("parsing\n" + message.content);
            const parsed = parseTikzStyles(message.content);
            if (parsed.result !== undefined) {
              const s = parsed.result.setFilename(message.filename).inheritDataFrom(tikzStyles);
              setTikzStyles(s);
            } else {
              console.log(
                "Failed to parse tikzstyles:\n" +
                  parsed.errors.map(err => `${err.line} (${err.column}): ${err.message}`).join("\n")
              );
            }
          } else {
            console.error("No tikzstyles content received:", message.error);
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);

    return () => window.removeEventListener("message", handleMessage);
  });

  const tryParseGraph = (tikz: string) => {
    const parsed = parseTikzPicture(tikz);
    if (parsed.result !== undefined) {
      const g = parsed.result.inheritDataFrom(graph);
      setSelectedNodes(sel => sel.filter(id => g.nodeData.has(id)));
      setSelectedEdges(sel => sel.filter(id => g.edgeData.has(id)));
      setGraph(g);
    }
  };

  const updateFromGui = (tikz: string) => {
    vscode.postMessage({
      type: "updateFromGui",
      content: tikz,
    });
  };

  const handleCurrentNodeLabelChanged = (label: string) => {
    if (selectedNodes.size === 1) {
      setCurrentNodeLabel(label);

      if (isValidDelimString("{" + label + "}")) {
        const n = selectedNodes.first()!;
        const g = graph.updateNodeData(n, d => d.setLabel(label));
        handleGraphChange(g, true);
      }
    }
  };

  const handleNodeStyleChanged = (style: string, apply: boolean) => {
    setCurrentNodeStyle(style);
    if (apply) {
      const g = graph.mapNodeData(d =>
        selectedNodes.has(d.id) ? d.setProperty("style", style) : d
      );
      handleGraphChange(g, true);
    }

    document.getElementById("graph-editor")?.focus();
  };

  const handleEdgeStyleChanged = (style: string, apply: boolean) => {
    setCurrentEdgeStyle(style);
    if (apply) {
      const g = graph.mapEdgeData(d => {
        if (selectedEdges.has(d.id)) {
          if (style === "none") {
            return d.unset("style");
          } else {
            return d.setProperty("style", style);
          }
        }
        return d;
      });
      handleGraphChange(g, true);
    }

    document.getElementById("graph-editor")?.focus();
  };

  // handle a graph change from the graph editor. "commit" says the document should be updated
  // and an undo step registered.
  const handleGraphChange = (g: Graph, commit: boolean) => {
    setGraph(g);

    if (commit) {
      const value = g.tikz();
      updateFromGui(value);
    }
  };

  const handleSelectionChanged = (selectedNodes: Set<number>, selectedEdges: Set<number>) => {
    setSelectedNodes(selectedNodes);
    setSelectedEdges(selectedEdges);

    if (selectedNodes.size === 1) {
      setCurrentNodeLabel(graph.nodeData.get(selectedNodes.first()!)?.label);
    } else {
      setCurrentNodeLabel(undefined);
    }
  };

  const handleJumpToNode = (node: number) => {
    const [_, position] = graph.tikzWithPosition(node, undefined);
    console.log("got position", position);

    vscode.postMessage({
      type: "openCodeEditor",
      content: position,
    });
  };

  const handleJumpToEdge = (edge: number) => {
    const [_, position] = graph.tikzWithPosition(undefined, edge);
    console.log("got position", position);

    vscode.postMessage({
      type: "openCodeEditor",
      content: position,
    });
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Splitpane splitRatio={0.8} orientation="horizontal">
        <div>
          <Toolbar
            tool={tool}
            onToolChanged={t => {
              setTool(t);
              document.getElementById("graph-editor")?.focus();
            }}
          />
          <GraphEditor
            tool={tool}
            onToolChanged={setTool}
            enabled={true}
            graph={graph}
            onGraphChange={handleGraphChange}
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
            onSelectionChanged={handleSelectionChanged}
            onJumpToNode={handleJumpToNode}
            onJumpToEdge={handleJumpToEdge}
            tikzStyles={tikzStyles}
            currentNodeStyle={currentNodeStyle}
            currentEdgeStyle={currentEdgeStyle}
          />
        </div>
        <StylePanel
          tikzStyles={tikzStyles}
          currentNodeLabel={currentNodeLabel}
          currentNodeStyle={currentNodeStyle}
          currentEdgeStyle={currentEdgeStyle}
          onCurrentNodeLabelChanged={handleCurrentNodeLabelChanged}
          onNodeStyleChanged={handleNodeStyleChanged}
          onEdgeStyleChanged={handleEdgeStyleChanged}
        />
      </Splitpane>
      <style>
        {`
        input {
          width: 100%;
          background-color: var(--vscode-input-background);
          color: var(--vscode-input-foreground);
          border: 1px solid var(--vscode-input-border);
          border-radius: 2px;
          padding: 4px 8px;
          font-size: var(--vscode-editor-font-size);
          font-family: var(--vscode-editor-font-family);
          selection-color: var(--vscode-editor-selection-background);
        }
        input::selection {
          background-color: var(--vscode-editor-selectionBackground);
          color: var(--vscode-editor-selectionForeground);
        }
        input.error {
          border-color: red !important;
          outline: 1px solid red !important;
        }
      `}
      </style>
    </div>
  );
};

export default App;
