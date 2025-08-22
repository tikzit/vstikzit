import type { editor } from "monaco-editor";
import { loader } from "@monaco-editor/react";
// import * as monaco from "monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

// Configure the loader to use the webpack bundled monaco-editor
// instead of loading from CDN
// loader.config({ monaco, "vs/nls": { availableLanguages: {} } });

// @ts-ignore: don't need types
// import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

// self.MonacoEnvironment = {
//   getWorker(_, label) {
//     return new editorWorker();
//   },
// };

// loader.config({ monaco });

const tikzTokensProvider = {
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
};

export { tikzTokensProvider, editorOptions };
