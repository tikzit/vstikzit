import { Coord } from "./Data";

class SceneCoords {
  private _scale: number = 64;
  private _left: number = 40;
  private _right: number = 40;
  private _up: number = 40;
  private _down: number = 40;

  constructor(scale?: number, left?: number, right?: number, up?: number, down?: number) {
    this._scale = scale ?? 64;
    this._left = left ?? 40;
    this._right = right ?? 40;
    this._up = up ?? 40;
    this._down = down ?? 40;
  }

  // Getters
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
  public setScale(scale: number): SceneCoords {
    return new SceneCoords(scale, this._left, this._right, this._up, this._down);
  }

  public setLeft(left: number): SceneCoords {
    return new SceneCoords(this._scale, left, this._right, this._up, this._down);
  }

  public setRight(right: number): SceneCoords {
    return new SceneCoords(this._scale, this._left, right, this._up, this._down);
  }

  public setUp(up: number): SceneCoords {
    return new SceneCoords(this._scale, this._left, this._right, up, this._down);
  }

  public setDown(down: number): SceneCoords {
    return new SceneCoords(this._scale, this._left, this._right, this._up, down);
  }

  public get screenWidth(): number {
    return (this._left + this._right) * this._scale;
  }

  public get screenHeight(): number {
    return (this._up + this._down) * this._scale;
  }

  public get originX(): number {
    return this._left * this._scale;
  }

  public get originY(): number {
    return this._up * this._scale;
  }

  public coordToScreen(c: Coord): Coord {
    return new Coord(this.originX + this._scale * c.x, this.originY - this._scale * c.y);
  }

  public coordFromScreen(c: Coord): Coord {
    return new Coord((c.x - this.originX) / this._scale, (this.originY - c.y) / this._scale);
  }
}

export default SceneCoords;
