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
    return new Coord(this.width / 2 + this.scale * c.x, this.height / 2 - this.scale * c.y);
  }

  public coordFromScreen(c: Coord): Coord {
    return new Coord((c.x - this.width / 2) / this.scale, (this.height / 2 - c.y) / this.scale);
  }
}

export default SceneCoords;
