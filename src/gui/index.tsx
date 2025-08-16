import { createRoot } from "react-dom/client";
import "./monacoConfig"; // Configure Monaco to use webpack bundle
import App from "./App";

// VSCode WebView API types (should be available globally in webview context)
declare const acquireVsCodeApi: () => any;

console.log("Webview script starting...");

// Acquire VS Code API once at the top level
const vscode = acquireVsCodeApi();
console.log("VS Code API acquired");

// Get initial content from the script tag data
const initialContentScript = document.getElementById("initial-content") as HTMLScriptElement;
let initialContent = "";

try {
  initialContent = initialContentScript ? JSON.parse(initialContentScript.textContent || '""') : "";
  console.log("Initial content loaded:", initialContent.length, "characters");
} catch (error) {
  console.error("Error parsing initial content:", error);
  initialContent = "";
}

const container = document.getElementById("root");
console.log("Container found:", !!container);

if (container) {
  try {
    const root = createRoot(container);
    console.log("React root created, rendering App...");
    root.render(<App initialContent={initialContent} vscode={vscode} />);
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering React app:", error);
    container.innerHTML = `<div style="padding: 20px; color: red;">Error loading TikZ Editor: ${error}</div>`;
  }
} else {
  console.error("Root container not found!");
}
