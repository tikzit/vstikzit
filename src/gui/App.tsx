import { useState, useEffect } from "react";
import Split from "react-split";
import GraphEditor from "./GraphEditor";
import Graph from "../data/Graph";
import { parseTikzPicture, parseTikzStyles } from "../data/TikzParser";
import CodeEditor from "./CodeEditor";
import StylePanel from "./StylePanel";
import Styles from "../data/Styles";

interface AppProps {
  initialContent: string;
  vscode: any;
}

const App = ({ initialContent, vscode }: AppProps) => {
  const initialGraph = parseTikzPicture(initialContent).result ?? new Graph();

  // the current graph
  const [graph, setGraph] = useState<Graph>(initialGraph);

  // tikzstyles
  const [tikzStyles, setTikzStyles] = useState<Styles>(new Styles());

  // the content for the editor. Should only set this to externally reset the contents
  // of the component.
  const [editorContent, setEditorContent] = useState(initialContent);

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
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      console.log("got editor change");
      console.log(value.substring(0, 100));

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

  const handleGraphChange = (graph: Graph) => {
    console.log("got graph change");
    setGraph(graph);
  };

  vscode.postMessage({
    type: "getTikzStyles",
  });

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
          <GraphEditor graph={graph} onGraphChange={handleGraphChange} />
          <StylePanel tikzStyles={tikzStyles} />
        </Split>

        <CodeEditor content={editorContent} onChange={handleEditorChange} />
      </Split>
    </div>
  );
};

export default App;
