import { useEffect, useRef, useState } from "preact/hooks";
import { colorToHex, texColors } from "../lib/color";

interface ColorPickerProps {
  value: string | undefined;
  onChange?: (color: string) => void;
  presetColors?: Record<string, string>;
  disabled?: boolean;
}

const ColorPicker = ({
  value,
  onChange,
  presetColors = texColors,
  disabled = false,
}: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState(value);
  const [rgb, setRgb] = useState({ r: 0, g: 0, b: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLDivElement>(null);

  // Convert color value to hex for display
  const displayColor = colorToHex(currentColor) || currentColor;

  // Update RGB values when color changes
  useEffect(() => {
    const hex = colorToHex(currentColor) || currentColor;
    if (hex && hex.startsWith("#") && hex.length === 7) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      setRgb({ r, g, b });
    }
  }, [currentColor]);

  // Update current color when value prop changes
  useEffect(() => {
    setCurrentColor(value);
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: Event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        swatchRef.current &&
        !swatchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleColorChange = (newColor: string) => {
    setCurrentColor(newColor);
    onChange?.(newColor);
  };

  const handleRgbChange = (component: "r" | "g" | "b", value: number) => {
    const newRgb = { ...rgb, [component]: value };
    setRgb(newRgb);
    const hex = `#${newRgb.r.toString(16).padStart(2, "0")}${newRgb.g
      .toString(16)
      .padStart(2, "0")}${newRgb.b.toString(16).padStart(2, "0")}`;
    handleColorChange(hex);
  };

  const handleSwatchClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handlePresetClick = (color: string) => {
    handleColorChange(color);
    setIsOpen(false);
  };

  return (
    <div className="color-picker">
      <div
        ref={swatchRef}
        className={`color-swatch ${disabled ? "disabled" : ""}`}
        onClick={handleSwatchClick}
        style={{
          backgroundColor: value === undefined ? "var(--vscode-input-background)" : displayColor,
          border: "2px solid var(--vscode-input-border)",
          borderRadius: "4px",
          width: "30px",
          height: "25px",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "inline-block",
          top: "10px",
          position: "relative",
        }}
        title={value === undefined ? "No color selected" : `Current color: ${displayColor}`}
      >
        {value === undefined && (
          <svg
            width="30"
            height="25"
            viewBox="0 0 30 25"
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              pointerEvents: "none",
            }}
          >
            <line
              x1="5"
              y1="5"
              x2="25"
              y2="20"
              stroke="var(--vscode-foreground)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="25"
              y1="5"
              x2="5"
              y2="20"
              stroke="var(--vscode-foreground)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>

      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="color-dropdown"
          style={{
            position: "absolute",
            top: "35px",
            left: "0",
            backgroundColor: "var(--vscode-dropdown-background)",
            border: "1px solid var(--vscode-dropdown-border)",
            borderRadius: "4px",
            padding: "12px",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            zIndex: 1000,
            minWidth: "280px",
          }}
        >
          <div className="rgb-sliders" style={{ marginBottom: "16px" }}>
            <div style={{ marginBottom: "8px" }}>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.r}
                onChange={e => handleRgbChange("r", parseInt(e.currentTarget.value))}
                style={{
                  background: `linear-gradient(to right, #000000, #ff0000)`,
                }}
              />
              <label style={{ fontSize: "12px" }}>R: {rgb.r}</label>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.g}
                onChange={e => handleRgbChange("g", parseInt(e.currentTarget.value))}
                style={{
                  background: `linear-gradient(to right, #000000, #00ff00)`,
                }}
              />
              <label style={{ fontSize: "12px" }}>G: {rgb.g}</label>
            </div>

            <div style={{ marginBottom: "8px" }}>
              <input
                type="range"
                min="0"
                max="255"
                value={rgb.b}
                onChange={e => handleRgbChange("b", parseInt(e.currentTarget.value))}
                style={{
                  background: `linear-gradient(to right, #000000, #0000ff)`,
                }}
              />
              <label style={{ fontSize: "12px" }}>B: {rgb.b}</label>
            </div>

            <div
              style={{
                marginTop: "12px",
                padding: "8px",
                backgroundColor: displayColor,
                border: "1px solid var(--vscode-input-border)",
                borderRadius: "4px",
                textAlign: "center",
                fontSize: "12px",
                color: rgb.r + rgb.g + rgb.b > 384 ? "#000000" : "#ffffff",
              }}
            >
              {displayColor}
            </div>
          </div>

          <div className="preset-colors">
            <div style={{ marginBottom: "8px", fontSize: "14px", fontWeight: "bold" }}>Presets</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gap: "4px",
                maxHeight: "135px",
                overflowY: "hidden",
              }}
            >
              {Object.entries(presetColors).map(([colorName, hexColor]) => {
                return (
                  <div
                    key={colorName}
                    className="preset-swatch"
                    onClick={() => handlePresetClick(colorName)}
                    style={{
                      backgroundColor: hexColor,
                      width: "24px",
                      height: "24px",
                      border:
                        currentColor === colorName || currentColor === hexColor
                          ? "2px solid var(--vscode-focusBorder)"
                          : "2px solid var(--vscode-input-border)",
                      borderRadius: "4px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title={colorName}
                  >
                    {(currentColor === colorName || currentColor === hexColor) && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          backgroundColor: rgb.r + rgb.g + rgb.b > 384 ? "#000000" : "#ffffff",
                          borderRadius: "50%",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;
