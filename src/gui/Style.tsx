import { StyleData } from "../lib/Data";

interface StyleProps {
  data: StyleData;
  onChange: (newData: StyleData) => void;
}

const Style = ({ data, onChange }: StyleProps) => {
  return (
    <div style={{ width: "80%", maxWidth: "400px", margin: "auto" }}>
      <table className="style-table">
        <tr>
          <td>Name</td>
          <td>
            <input
              type="text"
              value={data.name}
              onInput={e => onChange(data.setName((e.target as HTMLInputElement).value))}
            />
          </td>
        </tr>
      </table>
    </div>
  );
};

export default Style;
