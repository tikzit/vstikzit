interface HelpProps {
  visible: boolean;
  onClose: () => void;
}

const Help = ({ visible, onClose }: HelpProps) => {
  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "80%",
        height: "80%",
        backgroundColor: "var(--vscode-editor-background)",
        color: "var(--vscode-editor-foreground)",
        border: "1px solid var(--vscode-panel-border)",
        zIndex: 1000,
      }}
    >
      <div style={{ position: "absolute", top: 8, right: 8 }}>
        <button onClick={onClose} style={{ fontSize: "16px", padding: "4px 8px" }}>
          ×
        </button>
      </div>
      <div
        style={{
          overflow: "auto",
          margin: "16px",
          backgroundColor: "var(--vscode-editor-background)",
          color: "var(--vscode-editor-foreground)",
        }}
      >
        <h2>Help</h2>
        <p>
          This is the help section. Here you can find useful information about using the
          application.
        </p>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default Help;
