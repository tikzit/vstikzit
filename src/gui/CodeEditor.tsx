import { useEffect, useRef } from "preact/hooks";
import * as monaco from "monaco-editor";

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  height?: string;
  theme?: "vs" | "vs-dark" | "hc-black";
  readOnly?: boolean;
}

const CodeEditor = ({ value = "", onChange, theme = "vs" }: CodeEditorProps) => {
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

      // Define LaTeX theme colors
      monaco.editor.defineTheme("latex-theme", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "comment", foreground: "008000" },
          { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
          { token: "string", foreground: "a31515" },
          { token: "variable.name", foreground: "800080" },
          { token: "number", foreground: "098658" },
          { token: "delimiter.bracket", foreground: "000000", fontStyle: "bold" },
          { token: "delimiter.square", foreground: "000000", fontStyle: "bold" },
        ],
        colors: {
          "editor.background": "#ffffff",
        },
      });
    }

    // Create the Monaco editor instance
    const editor = monaco.editor.create(editorRef.current, {
      value,
      language: "latex",
      theme: theme === "vs" ? "latex-theme" : theme,
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

  // Update editor theme when prop changes
  useEffect(() => {
    if (monacoEditorRef.current) {
      monaco.editor.setTheme(theme === "vs" ? "latex-theme" : theme);
    }
  }, [theme]);

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
