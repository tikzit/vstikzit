import { useState, useEffect, useRef } from "react";
import Split from "react-split";
import CodeEditor from "./CodeEditor";
import GraphEditor from "./GraphEditor";
import Graph from "../data/Graph";
import { parseTikzPicture } from "../data/TikzParser";

interface TikZEditorProps {
  initialContent: string;
}

const TikzEditor = ({ initialContent }: TikZEditorProps) => {
  const [code, setCode] = useState(initialContent);
  const [graph, setGraph] = useState<Graph>(new Graph());
  const vscode = useRef<any>(null);

  // Lazy initialization of VS Code API
  if (vscode.current === null) {
    vscode.current = acquireVsCodeApi();
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "update":
          setCode(message.content);

          const parsed = parseTikzPicture(message.content);
          if (parsed.result !== undefined) {
            setGraph(parsed.result);
          }

          break;
        case "getFileData":
          vscode.current.postMessage({
            type: "getFileData",
            content: code,
          });
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [code]);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);

      vscode.current.postMessage({
        type: "edit",
        content: value,
      });
    }
  };

  const handleGraphChange = (graph: Graph) => {
    setGraph(graph);
    setCode(graph.tikz());
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Split
        sizes={[70, 30]}
        minSize={0}
        expandToMin={false}
        gutterSize={10}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        direction="vertical"
        cursor="row-resize"
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <GraphEditor graph={graph} onGraphChange={handleGraphChange} />
        <CodeEditor code={code} onChange={handleEditorChange} />
      </Split>
    </div>
  );
};

export default TikzEditor;
