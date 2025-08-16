import { Coord } from "../data/Data";

class SceneCoords {
  public width: number;
  public height: number;
  public scale: number = 64;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public coordToScreen(c: Coord): Coord {
    return [this.width / 2 + this.scale * c[0], this.height / 2 - this.scale * c[1]];
  }

  public coordFromScreen(c: Coord): Coord {
    return [(c[0] - this.width / 2) / this.scale, (this.height / 2 - c[1]) / this.scale];
  }
}

export default SceneCoords;
