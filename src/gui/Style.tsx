import { colorFromHex, colorToHex, texColors } from "../lib/color";
import { StyleData } from "../lib/Data";
import ColorPicker from "./ColorPicker";
import InputWithOptions from "./InputWithOptions";

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
          <td className="form-label">name</td>
          <td>
            <input
              style={{ width: "100%" }}
              value={data.name}
              onInput={e => onChange(data.setName((e.target as HTMLInputElement).value))}
            />
          </td>
        </tr>
        <tr>
          <td className="form-label">draw</td>
          <td>
            <input
              style={{ width: "100px" }}
              value={colorNameOrHex("draw")}
              onInput={e => setColor("draw", (e.target as HTMLInputElement).value)}
            /> &nbsp;
            <ColorPicker value={colorHex("draw")} onChange={c => setColor("draw", c)} />
          </td>
        </tr>
        <tr>
          <td className="form-label">fill</td>
          <td>
            <input
              style={{ width: "100px" }}
              value={colorNameOrHex("fill")}
              onInput={e => setColor("fill", (e.target as HTMLInputElement).value)}
            /> &nbsp;
            <ColorPicker value={colorHex("fill")} onChange={c => setColor("fill", c)} />
          </td>
        </tr>
        <tr>
          <td className="form-label-alt">tikzit draw</td>
          <td>
            <input
              style={{ width: "100px" }}
              value={colorNameOrHex("tikzit draw")}
              onInput={e => setColor("tikzit draw", (e.target as HTMLInputElement).value)}
            /> &nbsp;
            <ColorPicker value={colorHex("tikzit draw")} onChange={c => setColor("tikzit draw", c)} />
          </td>
        </tr>
        <tr>
          <td className="form-label-alt">tikzit fill</td>
          <td>
            <input
              style={{ width: "100px" }}
              value={colorNameOrHex("tikzit fill")}
              onInput={e => setColor("tikzit fill", (e.target as HTMLInputElement).value)}
            /> &nbsp;
            <ColorPicker value={colorHex("tikzit fill")} onChange={c => setColor("tikzit fill", c)} />
          </td>
        </tr>
        <tr>
          <td className="form-label">shape</td>
          <td>
            <InputWithOptions
              style={{ width: "100%", height: "30px", marginTop: "8px" }}
              value={data.property("shape") ?? ""}
              options={["circle", "rectangle"]}
              onChange={v => {
                if (v === "") {
                  onChange(data.unset("shape"));
                } else {
                  onChange(data.setProperty("shape", v));
                }
              }} />
          </td>
        </tr>
        <tr>
          <td className="form-label-alt">tikzit shape</td>
          <td>
            <InputWithOptions
              style={{ width: "100%", height: "30px", margin: "8px 0px" }}
              value={data.property("tikzit shape") ?? ""}
              options={["circle", "rectangle"]}
              onChange={v => {
                if (v === "") {
                  onChange(data.unset("tikzit shape"));
                } else {
                  onChange(data.setProperty("tikzit shape", v));
                }
              }} />
          </td>
        </tr>
        {data.isEdgeStyle && (
          <tr>
            <td className="form-label">arrowheads</td>
            <td>
              <select
                style={{ width: "50px" }}
                onChange={e => {
                  const v = (e.target as HTMLSelectElement).value as "none" | "pointer" | "flat";
                  onChange(data.setArrowTail(v));
                }}
              >
                <option value="none" selected={data.arrowTail === "none"}></option>
                <option value="pointer" selected={data.arrowTail === "pointer"}>&lt;</option>
                <option value="flat" selected={data.arrowTail === "flat"}>|</option>
              </select>
              &nbsp;-&nbsp;
              <select
                style={{ width: "50px" }}
                onChange={e => {
                  const v = (e.target as HTMLSelectElement).value as "none" | "pointer" | "flat";
                  onChange(data.setArrowHead(v));
                }}
              >
                <option value="none" selected={data.arrowHead === "none"}></option>
                <option value="pointer" selected={data.arrowHead === "pointer"}>&gt;</option>
                <option value="flat" selected={data.arrowHead === "flat"}>|</option>
              </select>
            </td>
          </tr>
        )}
      </table>
    </div>
  );
};

export default Style;
