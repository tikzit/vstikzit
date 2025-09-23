import { useState, useEffect } from "preact/hooks";

import GraphEditor from "./GraphEditor";
import { GraphTool } from "./GraphEditor";
import Graph from "../lib/Graph";
import {
  isValidDelimString,
  ParseError,
  parseTikzPicture,
  parseTikzStyles,
} from "../lib/TikzParser";
import StylePanel from "./StylePanel";
import Styles from "../lib/Styles";
import Toolbar from "./Toolbar";
import Splitpane from "./Splitpane";
import TikzitHost from "../lib/TikzitHost";

interface TikzEditorContent {
  document: string;
  styleFile: string;
  styles: string;
}

interface AppProps {
  initialContent: TikzEditorContent;
  host: TikzitHost;
}

const TikzEditor = ({ initialContent, host }: AppProps) => {
  const parsed = parseTikzPicture(initialContent.document);
  const [graph, setGraph] = useState<Graph>(parsed.result ?? new Graph());
  const [enabled, setEnabled] = useState<boolean>(parsed.result !== undefined);
  const [parseErrors, setParseErrors] = useState<ParseError[]>(parsed.errors);
  const [tool, setTool] = useState<GraphTool>("select");
  const [currentNodeLabel, setCurrentNodeLabel] = useState<string | undefined>(undefined);
  const [currentNodeStyle, setCurrentNodeStyle] = useState<string>("none");
  const [currentEdgeStyle, setCurrentEdgeStyle] = useState<string>("none");
  const [selectedNodes, setSelectedNodes] = useState<Set<number>>(new Set());
  const [selectedEdges, setSelectedEdges] = useState<Set<number>>(new Set());

  const parsedStyles = parseTikzStyles(initialContent.styles);
  const [tikzStyles, setTikzStyles] = useState<Styles>(
    (parsedStyles.result ?? new Styles()).setFilename(initialContent.styleFile)
  );
  const [tikzStylesError, setTikzStylesError] = useState<boolean>(
    parsedStyles.result === undefined
  );

  useEffect(() => {
    host.onSourceUpdated(source => {
      tryParseGraph(source);
    });

    host.onTikzStylesUpdated((filename, source) => {
      const parsed = parseTikzStyles(source);
      if (parsed.result !== undefined) {
        const s = parsed.result.setFilename(filename);
        setTikzStyles(s);
        setTikzStylesError(false);
      } else {
        setTikzStylesError(true);
      }
    });
  });

  useEffect(() => {
    host.setErrors(parseErrors);
  }, [parseErrors]);

  const updateFromGui = (tikz: string) => {
    if (enabled) {
      host.updateSource(tikz);
    }
  };

  const refreshTikzStyles = (e: Event) => {
    if (e) {
      e.preventDefault();
    }
    host.refreshTikzStyles();
  };

  const openTikzStyles = (e: Event) => {
    if (e) {
      e.preventDefault();
    }
    host.openTikzStyles();
  };

  const tryParseGraph = (tikz: string) => {
    const parsed = parseTikzPicture(tikz);
    setParseErrors(parsed.errors);
    if (parsed.result !== undefined) {
      const g = parsed.result;
      g.inheritDataFrom(graph);
      setEnabled(true);
      setGraph(g);
      setSelectedNodes(sel => new Set(Array.from(sel).filter(id => g.hasNode(id))));
      setSelectedEdges(sel => new Set(Array.from(sel).filter(id => g.hasEdge(id))));
    } else {
      setEnabled(false);
      setSelectedNodes(new Set());
      setSelectedEdges(new Set());
    }
  };

  const handleCurrentNodeLabelChanged = (label: string) => {
    console.log("label changed to", label);
    if (selectedNodes.size === 1) {
      setCurrentNodeLabel(label);

      if (graph !== undefined && isValidDelimString("{" + label + "}")) {
        const [n] = selectedNodes;
        const g = graph.updateNodeData(n, d => d.setLabel(label));
        handleGraphChange(g, true);
      }
    }
  };

  const handleNodeStyleChanged = (style: string, apply: boolean) => {
    setCurrentNodeStyle(style);
    if (apply) {
      let g = graph;
      g = g.mapEdgeData(d => {
        let d1 = d;
        if (selectedNodes.has(d.source)) {
          const oldStyle = g.node(d.source)?.property("style");
          if (style === "none" && oldStyle !== "none" && d1.sourceAnchor === undefined) {
            d1 = d1.setSourceAnchor("center");
          } else if (style !== "none" && oldStyle === "none" && d1.sourceAnchor === "center") {
            d1 = d1.setSourceAnchor(undefined);
          }
        }

        if (selectedNodes.has(d.target)) {
          const oldStyle = g.node(d.target)?.property("style");
          if (style === "none" && oldStyle !== "none" && d1.targetAnchor === undefined) {
            d1 = d1.setTargetAnchor("center");
          } else if (style !== "none" && oldStyle === "none" && d1.targetAnchor === "center") {
            d1 = d1.setTargetAnchor(undefined);
          }
        }
        return d1;
      });

      g = g.mapNodeData(d => (selectedNodes.has(d.id) ? d.setProperty("style", style) : d));

      handleGraphChange(g, true);
    }

    document.getElementById("graph-editor")?.focus();
  };

  const handleEdgeStyleChanged = (style: string, apply: boolean) => {
    setCurrentEdgeStyle(style);
    if (apply) {
      const g = graph.mapEdgeData(d => {
        if (selectedEdges.has(d.id)) {
          if (style === "none") {
            return d.unset("style");
          } else {
            return d.setProperty("style", style);
          }
        }
        return d;
      });
      handleGraphChange(g, true);
    }

    document.getElementById("graph-editor")?.focus();
  };

  // handle a graph change from the graph editor. "commit" says the document should be updated
  // and an undo step registered.
  const handleGraphChange = (g: Graph, commit: boolean) => {
    setGraph(g);

    if (commit) {
      const value = g.tikz();
      updateFromGui(value);
    }
  };

  const handleSelectionChanged = (selectedNodes: Set<number>, selectedEdges: Set<number>) => {
    setSelectedNodes(selectedNodes);
    setSelectedEdges(selectedEdges);

    if (selectedNodes.size === 1) {
      const [n] = selectedNodes;
      setCurrentNodeLabel(graph.node(n)?.label);
    } else {
      setCurrentNodeLabel(undefined);
    }
  };

  const handleViewTikz = () => {
    let position = { line: 0, column: 0 };
    if (selectedNodes.size > 0) {
      const [node] = selectedNodes;
      const pos = graph.tikzWithPosition(node, undefined)[1]!;
      if (pos !== undefined) {
        position = pos;
      }
    } else if (selectedEdges.size > 0) {
      const [edge] = selectedEdges;
      const pos = graph.tikzWithPosition(undefined, edge)[1]!;
      if (pos !== undefined) {
        position = pos;
      }
    }

    host.openCodeEditor(position);
  };

  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <Splitpane splitRatio={0.8} orientation="horizontal">
        <div>
          <Toolbar
            tool={tool}
            onToolChanged={t => {
              setTool(t);
              document.getElementById("graph-editor")?.focus();
            }}
          />
          <GraphEditor
            tool={tool}
            onToolChanged={setTool}
            enabled={enabled}
            graph={graph}
            onGraphChange={handleGraphChange}
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
            onSelectionChanged={handleSelectionChanged}
            onViewTikz={handleViewTikz}
            tikzStyles={tikzStyles}
            currentNodeStyle={currentNodeStyle}
            currentEdgeStyle={currentEdgeStyle}
          />
        </div>
        <StylePanel
          tikzStyles={tikzStyles}
          editMode={false}
          error={tikzStylesError}
          currentNodeStyle={currentNodeStyle}
          currentEdgeStyle={currentEdgeStyle}
          onNodeStyleChanged={handleNodeStyleChanged}
          onEdgeStyleChanged={handleEdgeStyleChanged}
          currentNodeLabel={currentNodeLabel}
          onCurrentNodeLabelChanged={handleCurrentNodeLabelChanged}
          onEditStyles={openTikzStyles}
          onRefreshStyles={refreshTikzStyles}
        />
      </Splitpane>
    </div>
  );
};

export default TikzEditor;
export { TikzEditorContent };
