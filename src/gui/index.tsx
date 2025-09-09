import { render } from "preact";
import App from "./App";
import StyleEditor from "./StyleEditor";

// VSCode WebView API types (should be available globally in webview context)
declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();
const initialContentText = document.getElementById("initial-content")!.textContent!;
const container = document.getElementById("root")!;

export function renderTikzEditor() {
  try {
    const initialContent = JSON.parse(initialContentText);
    render(<App initialContent={initialContent} vscode={vscode} />, container);
  } catch (error) {
    console.error("Error rendering TikzEditor:", error);
    container.innerHTML = `<div style="padding: 20px; color: red;">${error}</div>`;
  }
}

export function renderStyleEditor() {
  try {
    const initialContent = JSON.parse(initialContentText);
    render(<StyleEditor initialContent={initialContent} vscode={vscode} />, container);
  } catch (error) {
    console.error("Error rendering StyleEditor:", error);
    container.innerHTML = `<div style="padding: 20px; color: red;">${error}</div>`;
  }
}