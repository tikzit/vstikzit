import { createRoot } from "react-dom/client";
import "../lib/editorSetup";
import App from "./App";

// VSCode WebView API types (should be available globally in webview context)
declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();
const initialContentText = document.getElementById("initial-content")!.textContent;
const container = document.getElementById("root")!;

try {
  const initialContent = JSON.parse(initialContentText);
  const root = createRoot(container);
  root.render(<App initialContent={initialContent} vscode={vscode} />);
} catch (error) {
  console.error("Error rendering React app:", error);
  container.innerHTML = `<div style="padding: 20px; color: red;">${error}</div>`;
}
