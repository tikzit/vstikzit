import { colorToHex } from "../lib/color";
import { computeControlPoints } from "../lib/curve";
import { PathData, StyleData } from "../lib/Data";
import Graph from "../lib/Graph";
import SceneCoords from "../lib/SceneCoords";
import Styles from "../lib/Styles";

interface PathProps {
  data: PathData;
  graph: Graph;
  tikzStyles: Styles;
  sceneCoords: SceneCoords;
}

const Path = ({ data, graph, tikzStyles, sceneCoords }: PathProps) => {
  if (data.edges.length === 0) return <></>;
  let edgeData = graph.edge(data.edges[0])!;
  const sty = tikzStyles.style(edgeData.property("style"));
  const fillColor = colorToHex(sty.property("tikzit fill") ?? sty.property("fill"));
  if (fillColor === undefined) return <></>;

  const start = sceneCoords.coordToScreen(graph.node(edgeData.source)!.coord);
  let d = `M${start.x},${start.y}`;

  for (const e in data.edges) {
    edgeData = graph.edge(data.edges[e])!;
    const sourceData = graph.node(edgeData.source)!;
    const targetData = graph.node(edgeData.target)!;
    let [cps] = computeControlPoints(tikzStyles, sourceData, targetData, edgeData);
    cps = cps.slice(1).map(c => sceneCoords.coordToScreen(c));
    d += ` C${cps[1].x},${cps[1].y} ${cps[2].x},${cps[2].y} ${cps[0].x},${cps[0].y}`;
  }

  return <path opacity={0.7} fill={fillColor} d={d} style={{ pointerEvents: "none" }} />;
};

export default Path;
