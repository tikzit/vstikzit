import { useState, useEffect, useRef } from "react";
import Split from "react-split";
import GraphEditor from "./GraphEditor";
import Graph from "../data/Graph";
import { parseTikzPicture } from "../data/TikzParser";
import { Editor } from "@monaco-editor/react";
import { editorOnMount, editorOptions } from "./editorSetup";
import CodeEditor from "./CodeEditor";

interface TikZEditorProps {
  initialContent: string;
}

const TikzEditor = ({ initialContent }: TikZEditorProps) => {
  const initialGraph = parseTikzPicture(initialContent).result ?? new Graph();

  // the tikz code for the current file
  const [tikz, setTikz] = useState(initialContent);

  // the current graph
  const [graph, setGraph] = useState<Graph>(initialGraph);

  // the content for the editor. Should only set this to externally reset the contents
  // of the component.
  const [editorContent, setEditorContent] = useState(initialContent);

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
          // TODO: handle updates from outside of this editor?
          break;
        case "getFileData":
          vscode.current.postMessage({
            type: "getFileData",
            content: tikz,
          });
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

      vscode.current.postMessage({
        type: "edit",
        content: value,
      });
    }
  };

  const handleGraphChange = (graph: Graph) => {
    console.log("got graph change");
    setGraph(graph);
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
        <CodeEditor content={editorContent} onChange={handleEditorChange} />
      </Split>
    </div>
  );
};

export default TikzEditor;
