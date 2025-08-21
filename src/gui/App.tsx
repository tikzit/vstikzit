import { Set, List } from "immutable";
import { useState, useEffect, useRef } from "react";
import Split from "react-split";

import GraphEditor from "./GraphEditor";
import { GraphTool } from "./GraphEditor";
import Graph from "../data/Graph";
import { parseTikzPicture, parseTikzStyles } from "../data/TikzParser";
import CodeEditor from "./CodeEditor";
import StylePanel from "./StylePanel";
import Styles from "../data/Styles";
import { tikzTokensProvider } from "./editorSetup";

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

  const [undoStack, setUndoStack] = useState<List<UndoState>>(List());
  const [redoStack, setRedoStack] = useState<List<UndoState>>(List());

  // the current graph being displayed
  const [graph, setGraph] = useState<Graph>(
    parseTikzPicture(initialContent.document).result ?? new Graph()
  );

  const editorRef = useRef(null);

  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(Set());
  const [selectedEdges, setSelectedEdges] = useState<Set<number>>(Set());

  // state used to re-initialise contents of the code editor
  const [initCode, setInitCode] = useState(initialContent.document);

  const [tikzStyles, setTikzStyles] = useState<Styles>(
    (parseTikzStyles(initialContent.styles).result ?? new Styles()).setFilename(
      initialContent.styleFile
    )
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
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

    // vscode.postMessage({
    //   type: "getTikzStyles",
    // });

    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleEditorMount = (editor: any, monaco: any) => {
    // Register TikZ language if not already registered
    if (!monaco.languages.getLanguages().find((lang: any) => lang.id === "tikz")) {
      monaco.languages.register({ id: "tikz" });
      monaco.languages.setMonarchTokensProvider("tikz", tikzTokensProvider);
      monaco.editor.setModelLanguage(editor.getModel()!, "tikz");
    }

    editorRef.current = editor;
  };

  // a change in the tikz code, triggered by the code editor
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      // console.log("got editor change");
      // console.log(value.substring(0, 100));

      const parsed = parseTikzPicture(value);
      if (parsed.result !== undefined) {
        console.log("graph parsed");
        const g = parsed.result.inheritDataFrom(graph);
        setGraph(g);
      }

      vscode.postMessage({
        type: "updateTextDocument",
        content: value,
      });
    }
  };

  // a change in the graph, triggered by the graph editor
  const handleGraphChange = (graph: Graph) => {
    console.log("got graph change");
    setGraph(graph);
    setInitCode(graph.tikz());
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
            onGraphChange={handleGraphChange}
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
            onSelectionChanged={handleSelectionChanged}
            tikzStyles={tikzStyles}
          />
          <StylePanel
            tool={tool}
            onToolChanged={setTool}
            tikzStyles={tikzStyles}
            currentNodeStyle="none"
            currentEdgeStyle="none"
          />
        </Split>

        <CodeEditor content={initCode} onChange={handleEditorChange} onMount={handleEditorMount} />
      </Split>
    </div>
  );
};

export default App;
