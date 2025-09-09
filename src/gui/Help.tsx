import { useEffect } from "preact/hooks";
import { commands } from "../lib/commands";

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
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

    let fancyShortcut = shortcut;

    // replace modifier keys on Mac
    if (isMac) {
      fancyShortcut = fancyShortcut.replace(/\bCtrl\b/g, '&#8984;');
      fancyShortcut = fancyShortcut.replace(/\bAlt\b/g, '&#8997;');
    }

    // replace common symbols
    fancyShortcut = fancyShortcut.replace(/Shift\+\?/g, '?');
    fancyShortcut = fancyShortcut.replace(/Plus\+\?/g, '+');

    // replace arrow keys
    fancyShortcut = fancyShortcut.replace(/\bArrowLeft\b/g, '&#8592;');
    fancyShortcut = fancyShortcut.replace(/\bArrowRight\b/g, '&#8594;');
    fancyShortcut = fancyShortcut.replace(/\bArrowUp\b/g, '&#8593;');
    fancyShortcut = fancyShortcut.replace(/\bArrowDown\b/g, '&#8595;');

    return fancyShortcut;
  }

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
        backgroundColor: "var(--vscode-editor-background)",
        color: "var(--vscode-editor-foreground)",
        border: "1px solid var(--vscode-panel-border)",
        zIndex: 1000,
      }}
    >
      <div style={{ position: "absolute", top: 4, right: 8 }}>
        <a href="#" style={{ color: "var(--vscode-button-hoverForeground)", textDecoration: "none", fontSize: "20px", cursor: "pointer" }} onClick={(e) => {
          e.preventDefault();
          onClose();
        }}>×</a>
      </div>
      <div
        id="help-content"
        style={{
          overflow: "auto",
          margin: "30px",
          height: "calc(100% - 75px)",
          backgroundColor: "var(--vscode-editor-background)",
          color: "var(--vscode-editor-foreground)",
          outline: "none",
        }}
        tabindex={0}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            onClose();
          }
        }}
      >
        <div>
          <h2>Help</h2>
          <p>
            To see TikZiT commands for opening, building, and previewing TikZ files, open the command palette (Ctrl+Shift+P or Cmd+Shift+P) and type "TikZiT". Key bindings for the graph editor are as follows:
          </p>
          <br />
          <div>
            <table style={{ width: "300px", margin: "0 auto" }}>
              {commands.map(command => (
                <tr key={command.name} style={{ marginBottom: "4px", display: "block" }}>
                  <td width="150" style={{ fontStyle: "italic" }}>{command.description}</td>
                  <td>
                    <code style={{
                      backgroundColor: "var(--vscode-keybindingLabel-background)",
                      color: "var(--vscode-keybindingLabel-foreground)",
                      border: "1px solid var(--vscode-keybindingLabel-border)",
                      borderRadius: "3px",
                      padding: "2px 6px",
                      marginRight: "4px",
                      fontSize: "13px",
                      fontWeight: "normal"
                    }} dangerouslySetInnerHTML={{ __html: fancyShortcut(command.shortcuts[0]) }}></code>
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
