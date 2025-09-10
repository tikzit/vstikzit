import { useState, useEffect } from "preact/hooks";

import GraphEditor from "./GraphEditor";
import { GraphTool } from "./GraphEditor";
import Graph from "../lib/Graph";
import { isValidDelimString, parseTikzPicture, parseTikzStyles } from "../lib/TikzParser";
import StylePanel from "./StylePanel";
import Styles from "../lib/Styles";
import Toolbar from "./Toolbar";
import Splitpane from "./Splitpane";
import "./gui.css";

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

  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());
  const [selectedEdges, setSelectedEdges] = useState<Set<number>>(new Set());

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
            console.log("parsing\n" + message.content.source);
            const parsed = parseTikzStyles(message.content.source);
            if (parsed.result !== undefined) {
              const s = parsed.result
                .setFilename(message.content.filename);
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
      setSelectedNodes(sel => new Set(Array.from(sel).filter(id => g.hasNode(id))));
      setSelectedEdges(sel => new Set(Array.from(sel).filter(id => g.hasEdge(id))));
      setGraph(g);
    }
  };

  const updateFromGui = (tikz: string) => {
    vscode.postMessage({
      type: "updateFromGui",
      content: tikz,
    });
  };

  const refreshTikzStyles = () => {
    vscode.postMessage({
      type: "refreshTikzStyles",
    });
  };

  const handleCurrentNodeLabelChanged = (label: string) => {
    console.log("label changed to", label);
    if (selectedNodes.size === 1) {
      setCurrentNodeLabel(label);

      if (isValidDelimString("{" + label + "}")) {
        const [n] = selectedNodes;
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
      const [n] = selectedNodes;
      setCurrentNodeLabel(graph.node(n)?.label);
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
            onRefreshClicked={refreshTikzStyles}
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
          editMode={false}
        />
      </Splitpane>
    </div>
  );
};

export default App;
