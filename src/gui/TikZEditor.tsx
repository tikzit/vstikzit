import { useState, useEffect, useRef } from "react";
import Split from "react-split";
import GraphEditor from "./GraphEditor";
import Graph from "../data/Graph";
import { parseTikzPicture, parseTikzStyles } from "../data/TikzParser";
import CodeEditor from "./CodeEditor";
import StylePanel from "./StylePanel";
import Styles from "../data/Styles";

interface TikZEditorProps {
  initialContent: string;
  vscode: any;
}

const TikzEditor = ({ initialContent, vscode }: TikZEditorProps) => {
  const initialGraph = parseTikzPicture(initialContent).result ?? new Graph();

  // the tikz code for the current file
  const [tikz, setTikz] = useState(initialContent);

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
        case "update":
          // TODO: handle updates from outside of this editor?
          break;
        case "getFileData":
          vscode.postMessage({
            type: "getFileData",
            content: tikz,
          });
          break;
        case "tikzStylesContent":
          if (message.content) {
            console.log("parsing\n" + message.content);
            const parsed = parseTikzStyles(message.content);
            if (parsed.result !== undefined) {
              setTikzStyles(parsed.result);
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
  }, [tikz, editorContent]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      console.log("got editor change");
      console.log(value.substring(0, 100));
      setTikz(value);

      const parsed = parseTikzPicture(value);
      if (parsed.result !== undefined) {
        console.log("graph parsed");
        setGraph(parsed.result);
      }

      vscode.postMessage({
        type: "edit",
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

export default TikzEditor;
