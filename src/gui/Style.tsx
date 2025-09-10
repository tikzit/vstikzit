import { colorFromHex, colorToHex, texColors } from "../lib/color";
import { StyleData } from "../lib/Data";
import ColorPicker from "./ColorPicker";

interface StyleProps {
  data: StyleData;
  onChange: (newData: StyleData) => void;
}

const Style = ({ data, onChange }: StyleProps) => {
  const setColor = (property: string, color: string) => {
    if (color === "") {
      onChange(data.unset(property));
    } else {
      onChange(data.setProperty(property, colorFromHex(color) ?? color));
    }
  }

  const colorNameOrHex = (property: string): string => {
    const c = data.property(property);

    if (c === undefined) {
      return "";
    }

    if (c in texColors) {
      return c;
    }

    return colorToHex(c) ?? c;
  }

  const colorHex = (property: string): string | undefined => {
    const c = data.property(property);
    return colorToHex(c);
  }

  return (
    <div style={{ width: "80%", maxWidth: "400px", margin: "auto" }}>
      <table className="style-table">
        <tr>
          <td>Name</td>
          <td>
            <input
              type="text"
              value={data.name}
              style={{ width: "100%" }}
              onInput={e => onChange(data.setName((e.target as HTMLInputElement).value))}
            />
          </td>
        </tr>
        <tr>
          <td>draw</td>
          <td>
            <input style={{ width: "100px" }} value={colorNameOrHex("draw")} onInput={e => setColor("draw", (e.target as HTMLInputElement).value)} /> &nbsp;
            <ColorPicker value={colorHex("draw")} onChange={color => setColor("draw", color)} />
          </td>
        </tr>
      </table>
    </div>
  );
};

export default Style;
