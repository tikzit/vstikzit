import { render } from "preact";
import App from "./App";

// VSCode WebView API types (should be available globally in webview context)
declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();
const initialContentText = document.getElementById("initial-content")!.textContent!;
const container = document.getElementById("root")!;

try {
  const initialContent = JSON.parse(initialContentText);
  render(<App initialContent={initialContent} vscode={vscode} />, container);
} catch (error) {
  console.error("Error rendering Preact app:", error);
  container.innerHTML = `<div style="padding: 20px; color: red;">${error}</div>`;
}
