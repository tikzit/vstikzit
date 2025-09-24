import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

let configured = false;

export default function setupEditor() {
  if (!configured) {
    configured = true;

    // Register the TikZ language
    monaco.languages.register({ id: "tikz" });

    // Set up TikZ tokenization
    monaco.languages.setMonarchTokensProvider("tikz", {
      tokenizer: {
        root: [
          // Comments
          [/%.*$/, "comment"],

          // Commands
          [/\\[a-zA-Z@]+\*?/, "keyword"],

          // Math delimiters
          [/\$\$/, "string", "@mathBlock"],
          [/\$/, "string", "@mathInline"],
          [/\\\[/, "string", "@mathDisplay"],
          [/\\\(/, "string", "@mathInlineParen"],

          // Braces
          [/[{}]/, "delimiter.bracket"],
          [/[[\]]/, "delimiter.square"],

          // Special characters
          [/[&~^_]/, "keyword"],

          // Numbers
          [/\d+(\.\d+)?/, "number"],

          // Strings in quotes
          [/"([^"\\]|\\.)*"/, "string"],
          [/'([^'\\]|\\.)*'/, "string"],
        ],

        mathBlock: [
          [/\$\$/, "string", "@pop"],
          [/./, "variable.name"],
        ],

        mathInline: [
          [/\$/, "string", "@pop"],
          [/./, "variable.name"],
        ],

        mathDisplay: [
          [/\\\]/, "string", "@pop"],
          [/./, "variable.name"],
        ],

        mathInlineParen: [
          [/\\\)/, "string", "@pop"],
          [/./, "variable.name"],
        ],
      },
    });

    // Set up language configuration
    monaco.languages.setLanguageConfiguration("tikz", {
      comments: {
        lineComment: "%",
      },
      brackets: [
        ["{", "}"],
        ["[", "]"],
        ["(", ")"],
      ],
      autoClosingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "$", close: "$" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
      surroundingPairs: [
        { open: "{", close: "}" },
        { open: "[", close: "]" },
        { open: "(", close: ")" },
        { open: "$", close: "$" },
        { open: '"', close: '"' },
        { open: "'", close: "'" },
      ],
      folding: {
        markers: {
          start: new RegExp("\\\\begin\\{[^}]*\\}"),
          end: new RegExp("\\\\end\\{[^}]*\\}"),
        },
      },
    });

    monaco.editor.defineTheme("catppucchin-latte", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6c6f85" }, // Surface2
        { token: "keyword", foreground: "1e66f5", fontStyle: "bold" }, // Blue
        { token: "string", foreground: "40a02b" }, // Green
        { token: "variable.name", foreground: "8839ef" }, // Mauve
        { token: "number", foreground: "fe640b" }, // Peach
        { token: "delimiter.bracket", foreground: "4c4f69", fontStyle: "bold" }, // Text
        { token: "delimiter.square", foreground: "4c4f69", fontStyle: "bold" }, // Text
      ],
      colors: {
        "editor.background": "#eff1f5", // Base
        "editor.foreground": "#4c4f69", // Text
        "editorLineNumber.foreground": "#9ca0b0", // Surface1
        "editorLineNumber.activeForeground": "#4c4f69", // Text
        "editor.selectionBackground": "#acb0be40", // Surface0 with opacity
        "editor.selectionHighlightBackground": "#bcc0cc40", // Overlay0 with opacity
        "editorCursor.foreground": "#dc8a78", // Rosewater
        "editor.findMatchBackground": "#df8e1d40", // Yellow with opacity
        "editor.findMatchHighlightBackground": "#df8e1d20", // Yellow with less opacity
      },
    });
  }
}
