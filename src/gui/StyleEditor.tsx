import { useState } from "preact/hooks";
import Splitpane from "./Splitpane";
import StylePanel from "./StylePanel";
import { parseTikzStyles } from "../lib/TikzParser";
import Styles from "../lib/Styles";

interface IStyleEditorContent {
  document: string;
}

interface StyleEditorProps {
  initialContent: IStyleEditorContent;
  vscode: VsCodeApi;
}

const StyleEditor = ({ initialContent, vscode }: StyleEditorProps) => {
  const [currentNodeStyle, setCurrentNodeStyle] = useState<string>("none");
  const [currentEdgeStyle, setCurrentEdgeStyle] = useState<string>("none");
  const [tikzStyles, setTikzStyles] = useState<Styles>(
    parseTikzStyles(initialContent.document).result ?? new Styles());

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Splitpane splitRatio={0.8} orientation="horizontal">
        <div>
        </div>
        <StylePanel
          tikzStyles={tikzStyles}
          currentNodeLabel={undefined}
          currentNodeStyle={currentNodeStyle}
          currentEdgeStyle={currentEdgeStyle}
          onCurrentNodeLabelChanged={() => { }}
          onNodeStyleChanged={setCurrentNodeStyle}
          onEdgeStyleChanged={setCurrentEdgeStyle}
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

export default StyleEditor;