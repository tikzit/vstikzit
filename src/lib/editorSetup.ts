import type { editor, languages } from "monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

const tikzTokensProvider: languages.IMonarchLanguage = {
  tokenizer: {
    root: [
      [/%.*$/, "comment"],
      [/\\(begin|end)\{tikzpicture\}/, "keyword"],
      [/\\(begin|end)\{pgfonlayer\}/, "keyword"],
      [/\\(node|draw)/, "keyword"],
      [/\\[a-zA-Z@]+/, "type"],
      [/\[/, { token: "delimiter.bracket", next: "@options" }],
      [/\$/, { token: "string", next: "@math" }],
      [/[{}]/, "delimiter.curly"],
      [/\(([^)]*)\)/, "number"],
      [/-?\d*\.?\d+/, "number"],
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [
        /"/,
        {
          token: "string.quote",
          bracket: "@open",
          next: "@string",
        },
      ],
    ],
    options: [
      [/[^\]]+/, "attribute.name"],
      [/\]/, { token: "delimiter.bracket", next: "@pop" }],
    ],
    math: [
      [/[^$]+/, "string"],
      [/\$/, { token: "string", next: "@pop" }],
    ],
    string: [
      [/[^\\"]+/, "string"],
      [/\\./, "string.escape.invalid"],
      [/"/, { token: "string.quote", bracket: "@close", next: "@pop" }],
    ],
  },
};

const editorOptions: editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  wordWrap: "on",
  automaticLayout: true,
  lineNumbers: "on",
  folding: true,
  matchBrackets: "always",
  autoIndent: "full",
  formatOnType: true,
  formatOnPaste: true,
  language: "tikz",
  theme: "vs-dark",
};

function setupCodeEditor(vscode: any) {
  // Register TikZ language if not already registered
  if (!monaco.languages.getLanguages().find((lang: any) => lang.id === "tikz")) {
    monaco.languages.register({ id: "tikz" });
    monaco.languages.setMonarchTokensProvider("tikz", tikzTokensProvider);
  }
}

export { setupCodeEditor, editorOptions };
