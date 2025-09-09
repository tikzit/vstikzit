import { useState } from "preact/hooks";
import Splitpane from "./Splitpane";
import StylePanel from "./StylePanel";
import { parseTikzStyles } from "../lib/TikzParser";
import Styles from "../lib/Styles";
import "./gui.css";

interface IStyleEditorContent {
  document: string;
}

interface StyleEditorProps {
  initialContent: IStyleEditorContent;
  vscode: VsCodeApi;
}

const StyleEditor = ({ initialContent, vscode }: StyleEditorProps) => {
  const [tikzStyles, setTikzStyles] = useState<Styles>(
    parseTikzStyles(initialContent.document).result ?? new Styles()
  );
  const [currentStyle, setCurrentStyle] = useState<string>(tikzStyles.firstStyle ?? "");

  const currentStyleData = tikzStyles.style(currentStyle);
  const currentNodeStyle = currentStyleData.isEdgeStyle ? undefined : currentStyle;
  const currentEdgeStyle = currentStyleData.isEdgeStyle ? currentStyle : undefined;

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Splitpane splitRatio={0.8} orientation="horizontal">
        <div></div>
        <StylePanel
          tikzStyles={tikzStyles}
          currentNodeLabel={undefined}
          currentNodeStyle={currentNodeStyle}
          currentEdgeStyle={currentEdgeStyle}
          onCurrentNodeLabelChanged={() => {}}
          onNodeStyleChanged={setCurrentStyle}
          onEdgeStyleChanged={setCurrentStyle}
          editMode={true}
        />
      </Splitpane>
    </div>
  );
};

export default StyleEditor;
