import SceneCoords from "./SceneCoords";

const drawGrid = (svg: HTMLElement, sceneCoords: SceneCoords) => {
  const gridSize = sceneCoords.scale;
  const gridMinorSize = gridSize / 4;
  const width = sceneCoords.width;
  const height = sceneCoords.height;

  const axisColor = "#e99";
  const majorColor = "#acf";
  const minorColor = "#ddf";

  // create a group for the grid lines if it doesn't exist. Otherwise clear it
  let gridGroup = svg.querySelector("#grid")! as SVGGElement;
  gridGroup.innerHTML = "";

  let line: SVGLineElement;

  for (let x = gridMinorSize; x < width / 2; x += gridMinorSize) {
    const col = x % gridSize === 0 ? majorColor : minorColor;
    line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", `${width / 2 - x}`);
    line.setAttribute("y1", "0");
    line.setAttribute("x2", `${width / 2 - x}`);
    line.setAttribute("y2", `${height}`);
    line.setAttribute("stroke", col);
    gridGroup.appendChild(line);

    line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", `${width / 2 + x}`);
    line.setAttribute("y1", "0");
    line.setAttribute("x2", `${width / 2 + x}`);
    line.setAttribute("y2", `${height}`);
    line.setAttribute("stroke", col);
    gridGroup.appendChild(line);
  }

  for (let y = gridMinorSize; y < height / 2; y += gridMinorSize) {
    const col = y % gridSize === 0 ? majorColor : minorColor;
    line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", `${height / 2 - y}`);
    line.setAttribute("x2", `${width}`);
    line.setAttribute("y2", `${height / 2 - y}`);
    line.setAttribute("stroke", col);
    gridGroup.appendChild(line);

    line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", "0");
    line.setAttribute("y1", `${height / 2 + y}`);
    line.setAttribute("x2", `${width}`);
    line.setAttribute("y2", `${height / 2 + y}`);
    line.setAttribute("stroke", col);
    gridGroup.appendChild(line);
  }

  // Draw axes
  line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", "0");
  line.setAttribute("y1", `${height / 2}`);
  line.setAttribute("x2", `${width}`);
  line.setAttribute("y2", `${height / 2}`);
  line.setAttribute("stroke", axisColor);
  gridGroup.appendChild(line);

  line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", `${width / 2}`);
  line.setAttribute("y1", "0");
  line.setAttribute("x2", `${width / 2}`);
  line.setAttribute("y2", `${height}`);
  line.setAttribute("stroke", axisColor);
  gridGroup.appendChild(line);
};

export { drawGrid };
