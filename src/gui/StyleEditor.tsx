import { useEffect, useState } from "preact/hooks";
import Splitpane from "./Splitpane";
import StylePanel from "./StylePanel";
import { ParseError, parseTikzStyles } from "../lib/TikzParser";
import Styles from "../lib/Styles";
import Style from "./Style";
import { StyleData } from "../lib/Data";
import TikzitHost from "../lib/TikzitHost";

interface StyleEditorContent {
  document: string;
}

interface StyleEditorProps {
  initialContent: StyleEditorContent;
  host: TikzitHost;
}

const StyleEditor = ({ initialContent, host }: StyleEditorProps) => {
  const parsed = parseTikzStyles(initialContent.document);
  const [tikzStyles, setTikzStyles] = useState<Styles>(parsed.result ?? new Styles());
  const [enabled, setEnabled] = useState<boolean>(parsed.result !== undefined);
  const [parseErrors, setParseErrors] = useState<ParseError[]>(parsed.errors);
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
    setParseErrors(parsed.errors);
    if (parsed.result !== undefined) {
      const styles = parsed.result;
      setEnabled(true);
      setTikzStyles(styles);
      if (styles.style(currentStyle) === undefined) {
        setCurrentStyle(styles.firstStyleName ?? "none");
      }

      setCurrentStyleData(styles.style(currentStyle));
    } else {
      setEnabled(false);
    }
  };

  const updateFromGui = (tikz: string) => {
    if (enabled) {
      host.updateSource(tikz);
    }
  };

  useEffect(() => {
    host.onSourceUpdated(source => {
      tryParseStyles(source);
    });
  });

  useEffect(() => {
    setCurrentStyleData(tikzStyles.style(currentStyle));
  }, [currentStyle, tikzStyles]);

  useEffect(() => {
    host.setErrors(parseErrors);
  }, [parseErrors]);

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
    host.openCodeEditor(tikzStyles.tikzWithPosition(styleName)[1]);
  };

  const newStyle = (isEdgeStyle: boolean) => {
    const name = tikzStyles.freshStyleName;
    let d = new StyleData().setName(name);
    if (isEdgeStyle) {
      d = d.setAtom("-");
    }
    setTikzStyles(tikzStyles.addStyle(d));
    setCurrentStyle(name);
  };

  const moveStyle = (direction: "up" | "down") => {
    let updatedStyles: Styles;
    if (direction === "up") {
      updatedStyles = tikzStyles.moveStyleUp(currentStyle);
    } else {
      updatedStyles = tikzStyles.moveStyleDown(currentStyle);
    }
    if (!updatedStyles.equals(tikzStyles)) {
      setTikzStyles(updatedStyles);
      updateFromGui(updatedStyles.tikz());
    }
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <Splitpane splitRatio={0.8} orientation="horizontal">
        <div>
          <div className="button-container">
            <button onClick={() => newStyle(false)} disabled={!enabled}>
              + Node Style
            </button>
            <button onClick={() => newStyle(true)} disabled={!enabled}>
              + Edge Style
            </button>
            <button onClick={() => moveStyle("up")} disabled={!enabled}>
              &#129092;
            </button>
            <button onClick={() => moveStyle("down")} disabled={!enabled}>
              &#129094;
            </button>
            <button disabled={!(enabled && hasChanges)} onClick={applyStyleChanges}>
              &#10004; Apply
            </button>
            <button disabled={!(enabled && hasChanges)} onClick={resetStyleChanges}>
              &#8634; Reset
            </button>
            <button onClick={() => editStyle(currentStyle)}>&#9998; Edit</button>
            <button onClick={deleteStyle} disabled={!enabled}>
              &#128465; Delete
            </button>
          </div>
          <Style data={currentStyleData} onChange={setCurrentStyleData} enabled={enabled} />
        </div>
        <StylePanel
          tikzStyles={tikzStyles}
          error={!enabled}
          currentNodeLabel={undefined}
          currentNodeStyle={currentNodeStyle}
          currentEdgeStyle={currentEdgeStyle}
          onCurrentNodeLabelChanged={() => {}}
          onNodeStyleChanged={handleCurrentStyleChange}
          onEdgeStyleChanged={handleCurrentStyleChange}
          editMode={true}
        />
      </Splitpane>
    </div>
  );
};

export default StyleEditor;
export { StyleEditorContent };
