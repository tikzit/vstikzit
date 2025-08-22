import { Coord, EdgeData, NodeData } from "./Data";

function almostZero(f: number): boolean {
  return f >= -0.000001 && f <= 0.000001;
}

// function almostEqual(f1: number, f2: number): boolean {
//   return almostZero(f1 - f2);
// }

// return a new pair of coordinates along the same line, with the head and tail shortened by the given amounts
export function shortenLine(
  c1: Coord,
  c2: Coord,
  shortenHead: number,
  shortenTail: number
): [Coord, Coord] {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) {
    return [c1, c2];
  }
  const unitX = dx / len;
  const unitY = dy / len;
  return [
    c1.shift(unitX * shortenHead, unitY * shortenHead),
    c2.shift(-unitX * shortenTail, -unitY * shortenTail),
  ];
}

function linearInterpolate(dist: number, c0: number, c1: number): number {
  return (1 - dist) * c0 + dist * c1;
}

function cubicInterpolate(dist: number, c0: number, c1: number, c2: number, c3: number): number {
  const distp = 1 - dist;
  return (
    distp * distp * distp * c0 +
    3 * (distp * distp) * dist * c1 +
    3 * (dist * dist) * distp * c2 +
    dist * dist * dist * c3
  );
}

export function bezierInterpolate(
  dist: number,
  c1: Coord,
  c2: Coord,
  cp1: Coord,
  cp2: Coord
): Coord {
  return new Coord(
    cubicInterpolate(dist, c1.x, cp1.x, cp2.x, c2.x),
    cubicInterpolate(dist, c1.y, cp1.y, cp2.y, c2.y)
  );
}

export function tangent(
  [c1, c2, cp1, cp2]: [Coord, Coord, Coord | undefined, Coord | undefined],
  start: number,
  end: number
): Coord {
  let dx: number;
  let dy: number;

  if (cp1 !== undefined && cp2 !== undefined) {
    dx =
      cubicInterpolate(end, c1.x, cp1.x, cp2.x, c2.x) -
      cubicInterpolate(start, c1.x, cp1.x, cp2.x, c2.x);
    dy =
      cubicInterpolate(end, c1.y, cp1.y, cp2.y, c2.y) -
      cubicInterpolate(start, c1.y, cp1.y, cp2.y, c2.y);
  } else {
    dx = linearInterpolate(end, c1.x, c2.x) - linearInterpolate(start, c1.x, c2.x);
    dy = linearInterpolate(end, c1.y, c2.y) - linearInterpolate(start, c1.y, c2.y);
  }

  // normalise
  const len = Math.sqrt(dx * dx + dy * dy);
  if (!almostZero(len)) {
    const normalizedDx = (dx / len) * 0.1;
    const normalizedDy = (dy / len) * 0.1;
    return new Coord(normalizedDx, normalizedDy);
  }

  return new Coord(dx, dy);
}

export function computeControlPoints(
  sourceData: NodeData,
  targetData: NodeData,
  edgeData: EdgeData
): [Coord, Coord, Coord | undefined, Coord | undefined] {
  let c1 = sourceData.coord;
  let c2 = targetData.coord;
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;

  let cp1: Coord | undefined;
  let cp2: Coord | undefined;

  let weight: number;
  const looseness = edgeData.propertyFloat("looseness");
  if (looseness !== undefined) {
    weight = looseness / 2.5;
  } else {
    weight = edgeData.isSelfLoop ? 1.0 : 0.4;
  }

  // extract bend value from properties
  let bend: number | undefined;
  if (edgeData.hasKey("bend left")) {
    bend = -(edgeData.propertyInt("bend left") ?? 30);
  } else if (edgeData.hasKey("bend right")) {
    bend = edgeData.propertyInt("bend right") ?? 30;
  }

  let bezier = false;
  let inAngle: number;
  let outAngle: number;

  if (bend !== undefined) {
    // If bend is given, compute in/out angles relative to straight line
    const bendRadians = bend * (Math.PI / 180);
    const angle = Math.atan2(dy, dx);
    inAngle = Math.PI + angle + bendRadians;
    outAngle = angle - bendRadians;
    bezier = true;
  } else if (
    edgeData.propertyInt("in") !== undefined &&
    edgeData.propertyInt("out") !== undefined
  ) {
    // If in/out angles are given, use those directly
    inAngle = edgeData.propertyInt("in")! * (Math.PI / 180);
    outAngle = edgeData.propertyInt("out")! * (Math.PI / 180);

    bezier = true;
  } else {
    // Otherwise compute angles as a straight line
    outAngle = Math.atan2(dy, dx);
    inAngle = Math.PI + outAngle;
  }

  if (bezier) {
    const cpDist =
      almostZero(dx) && almostZero(dy) ? weight : Math.sqrt(dx * dx + dy * dy) * weight;
    cp1 = c1.shift(cpDist * Math.cos(outAngle), cpDist * Math.sin(outAngle));
    cp2 = c2.shift(cpDist * Math.cos(inAngle), cpDist * Math.sin(inAngle));
  }

  if ((sourceData.property("style") ?? "none") !== "none") {
    c1 = c1.shift(Math.cos(outAngle) * 0.2, Math.sin(outAngle) * 0.2);
  }

  if ((targetData.property("style") ?? "none") !== "none") {
    c2 = c2.shift(Math.cos(inAngle) * 0.2, Math.sin(inAngle) * 0.2);
  }

  return [c1, c2, cp1, cp2];
}
