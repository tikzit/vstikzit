import { useEffect, useRef } from "preact/hooks";
// import * as monaco from "monaco-editor";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const CodeEditor = ({ value = "", onChange }: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    // Register LaTeX language if not already registered
    if (!monaco.languages.getLanguages().find(lang => lang.id === "latex")) {
      // Register the LaTeX language
      monaco.languages.register({ id: "latex" });

      // Set up LaTeX tokenization
      monaco.languages.setMonarchTokensProvider("latex", {
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
      monaco.languages.setLanguageConfiguration("latex", {
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

      // Define LaTeX theme colors - Catppuccin Latte
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

    // Create the Monaco editor instance
    const editor = monaco.editor.create(editorRef.current, {
      value,
      language: "latex",
      theme: "catppucchin-latte",
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      lineNumbers: "on",
      fontSize: 14,
      lineHeight: 20,
    });

    monacoEditorRef.current = editor;

    // Set up change listener
    const disposable = editor.onDidChangeModelContent(() => {
      if (onChange) {
        onChange(editor.getValue());
      }
    });

    // Cleanup function
    return () => {
      disposable.dispose();
      editor.dispose();
    };
  }, []);

  // Update editor value when prop changes
  useEffect(() => {
    if (monacoEditorRef.current && monacoEditorRef.current.getValue() !== value) {
      monacoEditorRef.current.setValue(value);
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      style={{
        height: "100%",
        width: "100%",
        border: "1px solid #ccc",
        borderRadius: "4px",
      }}
    />
  );
};

export default CodeEditor;
