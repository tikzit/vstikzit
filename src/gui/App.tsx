import { Set } from "immutable";
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
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

interface IContent {
  document: string;
  styleFile: string;
  styles: string;
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
  const [codeSelection, setCodeSelection] = useState<monaco.ISelection | undefined>(undefined);

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
            // console.log("got update from vscode");
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

  // handle a graph change from the graph editor. "commit" says the document should be updated
  // and an undo step registered.
  const handleGraphChange = (g: Graph, commit: boolean) => {
    setGraph(g);

    if (commit) {
      const value = g.tikz();
      setCode(value);
      updateFromGui(value);
    }
  };

  const handleSelectionChanged = (selectedNodes: Set<number>, selectedEdges: Set<number>) => {
    setSelectedNodes(selectedNodes);
    setSelectedEdges(selectedEdges);
  };

  const handleJumpToNode = (node: number) => {
    const [tikz, selection] = graph.tikzWithSelection(node);

    if (tikz !== code) {
      setCode(tikz);
      updateFromGui(tikz);
    }

    if (selection !== undefined) {
      setCodeSelection(selection);
    }
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
            onToolChanged={setTool}
            enabled={true}
            graph={graph}
            onGraphChange={handleGraphChange}
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
            onSelectionChanged={handleSelectionChanged}
            onJumpToNode={handleJumpToNode}
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

        <CodeEditor content={code} selection={codeSelection} onChange={handleEditorChange} />
      </Split>
    </div>
  );
};

export default App;
