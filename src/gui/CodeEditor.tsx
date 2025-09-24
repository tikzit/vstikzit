import { useEffect, useRef } from "preact/hooks";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import setupEditor from "./setupEditor";

interface CodeEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const CodeEditor = ({ value = "", onChange }: CodeEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    setupEditor();

    // Create the Monaco editor instance
    const editor = monaco.editor.create(containerRef.current, {
      value,
      language: "tikz",
      theme: "catppucchin-latte",
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "on",
      lineNumbers: "on",
      fontSize: 14,
      lineHeight: 20,
    });

    editorRef.current = editor;

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
    const editor = editorRef.current;
    if (editor && editor.getValue() !== value) {
      const model = editor.getModel();
      if (model) {
        editor.pushUndoStop();
        const ops = [{ range: model.getFullModelRange(), text: value }];
        model.pushEditOperations([], ops, () => null);
        editor.pushUndoStop();
      }
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
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
