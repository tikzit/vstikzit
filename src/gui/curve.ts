import { Coord, EdgeData } from "../data/Data";
import SceneCoords from "./SceneCoords";

function almostZero(f: number): boolean {
  return f >= -0.000001 && f <= 0.000001;
}

function almostEqual(f1: number, f2: number): boolean {
  return almostZero(f1 - f2);
}

function bezierInterpolate1(dist: number, c0: number, c1: number, c2: number, c3: number): number {
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
    bezierInterpolate1(dist, c1.x, cp1.x, cp2.x, c2.x),
    bezierInterpolate1(dist, c1.y, cp1.y, cp2.y, c2.y)
  );
}

export function bezierTangent(
  c1: Coord,
  c2: Coord,
  cp1: Coord,
  cp2: Coord,
  start: number,
  end: number
): Coord {
  const dx =
    bezierInterpolate1(end, c1.x, cp1.x, cp2.x, c2.x) -
    bezierInterpolate1(start, c1.x, cp1.x, cp2.x, c2.x);
  const dy =
    bezierInterpolate1(end, c1.y, cp1.y, cp2.y, c2.y) -
    bezierInterpolate1(start, c1.y, cp1.y, cp2.y, c2.y);

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
  coord1: Coord,
  coord2: Coord,
  edgeData: EdgeData,
  sceneCoords: SceneCoords
): [Coord, Coord, Coord | undefined, Coord | undefined] {
  const c1 = sceneCoords.coordToScreen(coord1);
  const c2 = sceneCoords.coordToScreen(coord2);
  return [c1, c2, undefined, undefined];
}
