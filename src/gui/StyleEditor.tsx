import { useEffect, useState } from "preact/hooks";
import Splitpane from "./Splitpane";
import StylePanel from "./StylePanel";
import { parseTikzStyles } from "../lib/TikzParser";
import Styles from "../lib/Styles";
import "./gui.css";
import Style from "./Style";
import { StyleData } from "../lib/Data";

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
  const [currentStyle, setCurrentStyle] = useState<string>(tikzStyles.firstStyleName ?? "none");
  const [currentStyleData, setCurrentStyleData] = useState<StyleData>(
    tikzStyles.style(currentStyle)
  );
  const currentNodeStyle = currentStyleData.isEdgeStyle ? undefined : currentStyle;
  const currentEdgeStyle = currentStyleData.isEdgeStyle ? currentStyle : undefined;

  // Check if current style data differs from saved style data
  const hasChanges = !currentStyleData.equals(tikzStyles.style(currentStyle));

  const tryParseStyles = (tikz: string) => {
    const parsed = parseTikzStyles(tikz);
    if (parsed.result !== undefined) {
      const styles = parsed.result;
      setTikzStyles(styles);
      if (styles.style(currentStyle) === undefined) {
        setCurrentStyle(styles.firstStyleName ?? "none");
      }

      setCurrentStyleData(styles.style(currentStyle));
    }
  };

  const updateFromGui = (tikz: string) => {
    vscode.postMessage({
      type: "updateFromGui",
      content: tikz,
    });
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      switch (message.type) {
        case "updateToGui":
          if (message.content) {
            tryParseStyles(message.content);
          }
          break;
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  });

  useEffect(() => {
    setCurrentStyleData(tikzStyles.style(currentStyle));
  }, [currentStyle, tikzStyles]);

  const handleCurrentStyleChange = (styleName: string, doubleClicked: boolean) => {
    if (hasChanges && styleName !== currentStyle) {
      if (!applyStyleChanges()) {
        return;
      }
    }

    setCurrentStyle(styleName);
    setCurrentStyleData(tikzStyles.style(styleName));

    if (doubleClicked) {
      editStyle(styleName);
    }
  };

  // const handleStyleDataChange = (newData: StyleData) => {
  //   const data = tikzStyles.style(newData.name);
  //   setCurrentStyleData(newData);
  // };

  const applyStyleChanges = (): boolean => {
    let updatedStyles = tikzStyles;
    if (currentStyleData.name !== currentStyle && tikzStyles.hasStyle(currentStyleData.name)) {
      alert("A style with this name already exists.");
      return false;
    }
    updatedStyles = updatedStyles.updateStyle(currentStyle, currentStyleData);
    setCurrentStyle(currentStyleData.name);
    setTikzStyles(updatedStyles);
    updateFromGui(updatedStyles.tikz());
    return true;
  };

  const resetStyleChanges = () => {
    setCurrentStyleData(tikzStyles.style(currentStyle));
  };

  const deleteStyle = () => {
    if (currentStyle === "none") {
      return;
    } else {
      const updatedStyles = tikzStyles.deleteStyle(currentStyle);
      setTikzStyles(updatedStyles);
      updateFromGui(updatedStyles.tikz());
      setCurrentStyle(updatedStyles.firstStyleName ?? "none");
    }
  };

  const editStyle = (styleName: string) => {
    const [_, position] = tikzStyles.tikzWithPosition(styleName);
    vscode.postMessage({
      type: "openCodeEditor",
      content: position ?? { line: 0, column: 0 },
    });
  }

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Splitpane splitRatio={0.8} orientation="horizontal">
        <div>
          <div className="button-container">
            <button>+ Node Style</button>
            <button>+ Edge Style</button>
            <button>&#129092;</button>
            <button>&#129094;</button>
            <button disabled={!hasChanges} onClick={applyStyleChanges}>
              &#10004; Apply
            </button>
            <button disabled={!hasChanges} onClick={resetStyleChanges}>
              &#8634; Reset
            </button>
            <button onClick={() => editStyle(currentStyle)}>
              &#9998; Edit
            </button>
            <button onClick={deleteStyle}>&#128465; Delete</button>
          </div>
          <Style data={currentStyleData} onChange={setCurrentStyleData} />
        </div>
        <StylePanel
          tikzStyles={tikzStyles}
          currentNodeLabel={undefined}
          currentNodeStyle={currentNodeStyle}
          currentEdgeStyle={currentEdgeStyle}
          onCurrentNodeLabelChanged={() => { }}
          onNodeStyleChanged={handleCurrentStyleChange}
          onEdgeStyleChanged={handleCurrentStyleChange}
          editMode={true}
        />
      </Splitpane>
    </div>
  );
};

export default StyleEditor;
