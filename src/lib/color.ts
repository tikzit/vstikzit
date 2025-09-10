export const texColors: Record<string, string> = {
  black: "#000000",
  darkgray: "#404040",
  gray: "#808080",
  lightgray: "#bfbfbf",
  white: "#ffffff",
  red: "#ff0000",
  orange: "#ff8000",
  yellow: "#ffff00",
  green: "#00ff00",
  blue: "#0000ff",
  purple: "#bf0040",
  brown: "#bf8040",
  olive: "#808000",
  lime: "#bfff00",
  cyan: "#00ffff",
  teal: "#008080",
  magenta: "#ff00ff",
  violet: "#800080",
  pink: "#ffbfbf",
};

export const texColorsInverse: Record<string, string> = Object.fromEntries(
  Object.entries(texColors).map(([k, v]) => [v, k])
);

export function colorToHex(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined;
  }

  if (s in texColors) {
    return texColors[s];
  }

  const rgbPattern = /^\s*rgb,255\s*:\s*red,([0-9]+)\s*;\s*green,([0-9]+)\s*;\s*blue,([0-9]+)\s*$/;
  const match = s.match(rgbPattern);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);

    if (r > 255 || g > 255 || b > 255) {
      return undefined;
    }

    const hr = r.toString(16).padStart(2, "0");
    const hg = g.toString(16).padStart(2, "0");
    const hb = b.toString(16).padStart(2, "0");

    return `#${hr}${hg}${hb}`;
  }
  return undefined;
}

export function colorFromHex(s: string | undefined): string | undefined {
  if (s === undefined) {
    return undefined;
  }

  if (s in texColorsInverse) {
    return texColorsInverse[s];
  }

  const hexPattern = /^#([0-9a-fA-F][0-9a-fA-F])([0-9a-fA-F][0-9a-fA-F])([0-9a-fA-F][0-9a-fA-F])$/;
  const match = s.match(hexPattern);
  if (match) {
    const r = parseInt(match[1], 16);
    const g = parseInt(match[2], 16);
    const b = parseInt(match[3], 16);
    return `rgb,255: red,${r}; green,${g}; blue,${b}`;
  }
  return undefined;
}