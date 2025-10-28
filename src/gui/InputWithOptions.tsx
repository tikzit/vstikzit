import { CSSProperties } from "preact";

interface InputWithOptionsProps {
  style?: CSSProperties;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const InputWithOptions = ({
  style = {},
  value,
  options,
  onChange,
  disabled = false,
}: InputWithOptionsProps) => {
  return (
    <div style={{ position: "relative", ...style }}>
      <select
        disabled={disabled}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          boxSizing: "border-box",
          outline: "none",
        }}
        value={value}
        onChange={e => onChange((e.target as HTMLSelectElement).value)}
      >
        {options.map(option => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <input
        disabled={disabled}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "calc(100% - 20px)",
          marginBottom: "2px",
          boxSizing: "border-box",
        }}
        value={value}
        onInput={e => onChange((e.target as HTMLInputElement).value)}
      />
    </div>
  );
};

export default InputWithOptions;
