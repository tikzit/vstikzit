import { useEffect } from "preact/hooks";

interface HelpProps {
  visible: boolean;
  onClose: () => void;
}

const Help = ({ visible, onClose }: HelpProps) => {
  useEffect(() => {
    if (visible) {
      const helpContent = document.getElementById("help-content");
      helpContent?.focus();
    }
  }, [visible]);

  const fancyShortcut = (shortcut: string) => {
    const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

    let fancyShortcut = shortcut;

    // replace modifier keys on Mac
    if (isMac) {
      fancyShortcut = fancyShortcut.replace(/\bCtrl\b/g, "&#8984;");
      fancyShortcut = fancyShortcut.replace(/\bAlt\b/g, "&#8997;");
    }

    // replace common symbols
    fancyShortcut = fancyShortcut.replace(/Shift\+\?/g, "?");
    fancyShortcut = fancyShortcut.replace(/Plus\+\?/g, "+");

    // replace arrow keys
    fancyShortcut = fancyShortcut.replace(/\bArrowLeft\b/g, "&#8592;");
    fancyShortcut = fancyShortcut.replace(/\bArrowRight\b/g, "&#8594;");
    fancyShortcut = fancyShortcut.replace(/\bArrowUp\b/g, "&#8593;");
    fancyShortcut = fancyShortcut.replace(/\bArrowDown\b/g, "&#8595;");

    return fancyShortcut;
  };

  const commands = [
    { name: "vstikzit.showHelp", shortcuts: ["Shift+?"], description: "Show help" },
    { name: "vstikzit.selectTool", shortcuts: ["S"], description: "Select tool" },
    { name: "vstikzit.nodeTool", shortcuts: ["N"], description: "Node tool" },
    { name: "vstikzit.edgeTool", shortcuts: ["E"], description: "Edge tool" },
    { name: "vstikzit.zoomOut", shortcuts: ["-", "_"], description: "Zoom out" },
    { name: "vstikzit.zoomIn", shortcuts: ["=", "+"], description: "Zoom in" },
    { name: "vstikzit.cut", shortcuts: ["Ctrl+X"], description: "Cut" },
    { name: "vstikzit.copy", shortcuts: ["Ctrl+C"], description: "Copy" },
    { name: "vstikzit.paste", shortcuts: ["Ctrl+V"], description: "Paste" },
    { name: "vstikzit.delete", shortcuts: ["Delete"], description: "Delete items" },
  ];

  return (
    <div
      style={{
        display: visible ? "block" : "none",
        position: "absolute",
        margin: "auto",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        width: "80%",
        height: "80%",
        backgroundColor: "var(--tikzit-editor-background)",
        color: "var(--tikzit-editor-foreground)",
        border: "1px solid var(--tikzit-panel-border)",
        zIndex: 1000,
      }}
    >
      <div style={{ position: "absolute", top: 4, right: 8 }}>
        <a
          href="#"
          style={{
            color: "var(--tikzit-button-hoverForeground)",
            textDecoration: "none",
            fontSize: "20px",
            cursor: "pointer",
          }}
          onClick={e => {
            e.preventDefault();
            onClose();
          }}
        >
          ×
        </a>
      </div>
      <div
        id="help-content"
        style={{
          overflow: "auto",
          margin: "30px",
          height: "calc(100% - 75px)",
          backgroundColor: "var(--tikzit-editor-background)",
          color: "var(--tikzit-editor-foreground)",
          outline: "none",
        }}
        tabindex={0}
        onKeyDown={e => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
      >
        <div>
          <h2>Help</h2>
          <p>
            Most commands can be accessed via the command palette (Ctrl+Shift+P or Cmd+Shift+P on
            Mac) and typing "tikzit". To view and edit keybindings for those commands, run
            "Preferences: Open Keyboard Shortcuts" from the command palette and search for "tikzit".
            A few commands are built-in to the graph editor and not customisable. They are as
            follows:
          </p>
          <br />
          <div>
            <table style={{ width: "300px", margin: "0 auto" }}>
              {commands.map(command => (
                <tr key={command.name} style={{ marginBottom: "4px", display: "block" }}>
                  <td width="150" style={{ fontStyle: "italic" }}>
                    {command.description}
                  </td>
                  <td>
                    <code
                      style={{
                        backgroundColor: "var(--tikzit-keybindingLabel-background)",
                        color: "var(--tikzit-keybindingLabel-foreground)",
                        border: "1px solid var(--tikzit-keybindingLabel-border)",
                        borderRadius: "3px",
                        padding: "2px 6px",
                        marginRight: "4px",
                        fontSize: "13px",
                        fontWeight: "normal",
                      }}
                      dangerouslySetInnerHTML={{ __html: fancyShortcut(command.shortcuts[0]) }}
                    ></code>
                  </td>
                </tr>
              ))}
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Help;
