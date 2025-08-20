import { useState, useEffect } from "react";
import Split from "react-split";
import GraphEditor from "./GraphEditor";
import Graph from "../data/Graph";
import { parseTikzPicture, parseTikzStyles } from "../data/TikzParser";
import CodeEditor from "./CodeEditor";
import StylePanel from "./StylePanel";
import Styles from "../data/Styles";

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
  // the current graph being displayed
  const [graph, setGraph] = useState<Graph>(
    parseTikzPicture(initialContent.document).result ?? new Graph()
  );

  // state used to re-initial contents of the code editor
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
          <GraphEditor graph={graph} onGraphChange={handleGraphChange} tikzStyles={tikzStyles} />
          <StylePanel tikzStyles={tikzStyles} />
        </Split>

        <CodeEditor content={initCode} onChange={handleEditorChange} />
      </Split>
    </div>
  );
};

export default App;
