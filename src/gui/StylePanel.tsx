interface StylePanelProps {}

const StylePanel = ({}: StylePanelProps) => {
  return (
    <div style={{ padding: "10px", backgroundColor: "#fff", color: "#000" }}>
      <i>[no .tikzstyles]</i>
    </div>
  );
};

export default StylePanel;
