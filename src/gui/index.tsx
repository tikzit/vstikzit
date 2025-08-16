import { createRoot } from "react-dom/client";
import "./monacoConfig"; // Configure Monaco to use webpack bundle
import App from "./App";

console.log("Webview script starting...");

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
    root.render(<App initialContent={initialContent} />);
    console.log("App rendered successfully");
  } catch (error) {
    console.error("Error rendering React app:", error);
    container.innerHTML = `<div style="padding: 20px; color: red;">Error loading TikZ Editor: ${error}</div>`;
  }
} else {
  console.error("Root container not found!");
}
