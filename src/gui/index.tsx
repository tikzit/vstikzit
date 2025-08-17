import { createRoot } from "react-dom/client";
import "./editorSetup";
import App from "./App";

// VSCode WebView API types (should be available globally in webview context)
declare const acquireVsCodeApi: () => any;
const vscode = acquireVsCodeApi();
const initialContentScript = document.getElementById("initial-content")! as HTMLScriptElement;
const container = document.getElementById("root")!;

let initialContent = "";

try {
  initialContent = JSON.parse(initialContentScript.textContent || '""');
  const root = createRoot(container);
  root.render(<App initialContent={initialContent} vscode={vscode} />);
} catch (error) {
  console.error("Error rendering React app:", error);
  container.innerHTML = `<div style="padding: 20px; color: red;">${error}</div>`;
}
