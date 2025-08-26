import { Set, List } from "immutable";
import { useState, useEffect } from "react";
import Split from "react-split";

import GraphEditor from "./GraphEditor";
import { GraphTool } from "./GraphEditor";
import Graph from "../lib/Graph";
import { parseTikzPicture, parseTikzStyles } from "../lib/TikzParser";
import CodeEditor from "./CodeEditor";
import StylePanel from "./StylePanel";
import Styles from "../lib/Styles";
import { setupCodeEditor } from "../lib/editorSetup";

interface IContent {
  document: string;
  styleFile: string;
  styles: string;
}

// merge undo items where merge=true in 5-second chunks
const mergeResolution = 5000;

interface UndoState {
  graph?: Graph;
  tikz?: string;
  selectedNodes: Set<number>;
  selectedEdges: Set<number>;
  timestamp: number;
  merge: boolean;
}

interface AppProps {
  initialContent: IContent;
  vscode: any;
}

const App = ({ initialContent, vscode }: AppProps) => {
  const [tool, setTool] = useState<GraphTool>("select");

  // the current graph being displayed
  const [graph, setGraph] = useState<Graph>(
    parseTikzPicture(initialContent.document).result ?? new Graph()
  );

  // state used to re-initialise contents of the code editor
  const [code, setCode] = useState(initialContent.document);

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
    setupCodeEditor(vscode);

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "updateToGui":
          if (message.content) {
            console.log("got update from vscode");
            setCode(message.content);
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

  // a change in the tikz code, triggered by the user editing it
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      tryParseGraph(value);
      updateFromGui(value);
    }
  };

  // signals the graph has changed and an undo step should be registered, triggered by the graph editor
  const handleCommitGraph = () => {
    const value = graph.tikz();
    setCode(value);
    updateFromGui(value);
  };

  const handleSelectionChanged = (selectedNodes: Set<number>, selectedEdges: Set<number>) => {
    setSelectedNodes(selectedNodes);
    setSelectedEdges(selectedEdges);
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Split
        sizes={[80, 20]}
        minSize={0}
        direction="vertical"
        cursor="row-resize"
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <Split
          sizes={[80, 20]}
          minSize={0}
          direction="horizontal"
          cursor="col-resize"
          style={{ display: "flex", flexDirection: "row", height: "100%" }}
        >
          <GraphEditor
            tool={tool}
            enabled={true}
            graph={graph}
            onGraphChange={setGraph}
            onCommitGraph={handleCommitGraph}
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
            onSelectionChanged={handleSelectionChanged}
            tikzStyles={tikzStyles}
            currentNodeStyle={currentNodeStyle}
            currentEdgeStyle={currentEdgeStyle}
          />
          <StylePanel
            tool={tool}
            onToolChanged={setTool}
            tikzStyles={tikzStyles}
            currentNodeStyle={currentNodeStyle}
            currentEdgeStyle={currentEdgeStyle}
            onNodeStyleChanged={setCurrentNodeStyle}
            onEdgeStyleChanged={setCurrentEdgeStyle}
          />
        </Split>

        <CodeEditor content={code} onChange={handleEditorChange} />
      </Split>
    </div>
  );
};

export default App;
