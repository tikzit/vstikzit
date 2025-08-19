import * as assert from "assert";
import { colorToHex } from "../gui/color";

describe("colorToHex", () => {
  describe("named colors", () => {
    it("should return correct hex for named colors", () => {
      assert.strictEqual(colorToHex("black"), "#000000");
      assert.strictEqual(colorToHex("white"), "#ffffff");
      assert.strictEqual(colorToHex("red"), "#ff0000");
      assert.strictEqual(colorToHex("green"), "#00ff00");
      assert.strictEqual(colorToHex("blue"), "#0000ff");
      assert.strictEqual(colorToHex("yellow"), "#ffff00");
      assert.strictEqual(colorToHex("violet"), "#800080");
      assert.strictEqual(colorToHex("pink"), "#ffbfbf");
    });

    it("should return undefined for unknown color names", () => {
      assert.strictEqual(colorToHex("unknown"), undefined);
      assert.strictEqual(colorToHex("notacolor"), undefined);
      assert.strictEqual(colorToHex(""), undefined);
    });
  });

  describe("RGB format colors", () => {
    it("should parse valid RGB format correctly", () => {
      assert.strictEqual(colorToHex("rgb,255: red,221; green,255; blue,221"), "#ddffdd");
      assert.strictEqual(colorToHex("rgb,255: red,255; green,128; blue,0"), "#ff8000");
      assert.strictEqual(colorToHex("rgb,255: red,0; green,0; blue,0"), "#000000");
      assert.strictEqual(colorToHex("rgb,255: red,255; green,255; blue,255"), "#ffffff");
    });

    it("should handle big and small values correctly", () => {
      assert.strictEqual(colorToHex("rgb,255: red,15; green,0; blue,255"), "#0f00ff");
      assert.strictEqual(colorToHex("rgb,255: red,1; green,2; blue,3"), "#010203");
      assert.strictEqual(colorToHex("rgb,255: red,0; green,255; blue,128"), "#00ff80");
      assert.strictEqual(colorToHex("rgb,255: red,255; green,0; blue,255"), "#ff00ff");
    });

    it("should handle whitespace variations", () => {
      assert.strictEqual(
        colorToHex("  rgb,255  :  red,100  ;  green,200  ;  blue,50  "),
        "#64c832"
      );
      assert.strictEqual(colorToHex("rgb,255:red,100;green,200;blue,50"), "#64c832");
    });

    it("should return undefined for invalid RGB values", () => {
      assert.strictEqual(colorToHex("rgb,255: red,256; green,255; blue,255"), undefined);
      assert.strictEqual(colorToHex("rgb,255: red,255; green,256; blue,255"), undefined);
      assert.strictEqual(colorToHex("rgb,255: red,255; green,255; blue,256"), undefined);
      assert.strictEqual(colorToHex("rgb,255: red,300; green,400; blue,500"), undefined);
    });

    it("should return undefined for malformed RGB strings", () => {
      assert.strictEqual(colorToHex("rgb,255: red,abc; green,255; blue,255"), undefined);
      assert.strictEqual(colorToHex("rgb,255: red,100; green,200"), undefined);
      assert.strictEqual(colorToHex("rgb: red,100; green,200; blue,50"), undefined);
      assert.strictEqual(colorToHex("invalid format"), undefined);
      assert.strictEqual(colorToHex("rgb,255: red,-10; green,200; blue,50"), undefined);
    });
  });
});
