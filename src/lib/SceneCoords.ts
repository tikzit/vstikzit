import { Coord } from "./Data";

const scaleFactor = 64;

class SceneCoords {
  private _scale: number = scaleFactor;
  private _zoom: number = 0;
  private _left: number = 40;
  private _right: number = 40;
  private _up: number = 40;
  private _down: number = 40;

  constructor(coords?: SceneCoords) {
    if (coords) {
      this._zoom = coords._zoom;
      this._left = coords._left;
      this._right = coords._right;
      this._up = coords._up;
      this._down = coords._down;
    }
  }

  public equals(other: SceneCoords): boolean {
    return (
      this._zoom === other._zoom &&
      this._left === other._left &&
      this._right === other._right &&
      this._up === other._up &&
      this._down === other._down
    );
  }

  // Getters
  public get zoom(): number {
    return this._zoom;
  }

  public get scale(): number {
    return this._scale;
  }

  public get left(): number {
    return this._left;
  }

  public get right(): number {
    return this._right;
  }

  public get up(): number {
    return this._up;
  }

  public get down(): number {
    return this._down;
  }

  // Setters that return new instances
  public setZoom(zoom: number): SceneCoords {
    const coords = new SceneCoords(this);
    coords._zoom = zoom;
    coords._scale = Math.round(Math.pow(1.25, zoom) * scaleFactor);
    return coords;
  }

  public setLeft(left: number): SceneCoords {
    const coords = new SceneCoords(this);
    coords._left = left;
    return coords;
  }

  public setRight(right: number): SceneCoords {
    const coords = new SceneCoords(this);
    coords._right = right;
    return coords;
  }

  public setUp(up: number): SceneCoords {
    const coords = new SceneCoords(this);
    coords._up = up;
    return coords;
  }

  public setDown(down: number): SceneCoords {
    const coords = new SceneCoords(this);
    coords._down = down;
    return coords;
  }

  public get screenWidth(): number {
    return (this._left + this._right) * this.scale;
  }

  public get screenHeight(): number {
    return (this._up + this._down) * this.scale;
  }

  public get originX(): number {
    return this._left * this.scale;
  }

  public get originY(): number {
    return this._up * this.scale;
  }

  public coordToScreen(c: Coord): Coord {
    return new Coord(this.originX + this.scale * c.x, this.originY - this.scale * c.y);
  }

  public coordFromScreen(c: Coord): Coord {
    return new Coord((c.x - this.originX) / this.scale, (this.originY - c.y) / this.scale);
  }

  public zoomIn(): SceneCoords {
    return this.setZoom(this._zoom + 1);
  }

  public zoomOut(): SceneCoords {
    return this.setZoom(this._zoom - 1);
  }
}

export default SceneCoords;
