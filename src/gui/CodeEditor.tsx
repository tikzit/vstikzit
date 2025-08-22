import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { editorOptions } from "../lib/editorSetup";

interface CodeEditorProps {
  content: string;
  onChange: (value: string | undefined) => void;
  onMount: (
    editor: monaco.editor.IStandaloneCodeEditor,
    monaco: typeof import("monaco-editor")
  ) => void;
}

const CodeEditor = ({ content, onChange, onMount }: CodeEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monaco | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      // Create the editor
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: content,
        language: "tex",
        theme: "vs",
        ...editorOptions,
      });

      monacoRef.current = monaco;

      // Set up the onChange listener
      editorRef.current.onDidChangeModelContent(() => {
        const value = editorRef.current?.getValue();
        onChange(value);
      });

      // Call the onMount callback
      onMount(editorRef.current, monaco);
    }

    // Cleanup function
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
        editorRef.current = null;
      }
    };
  }, []);

  // Update editor content when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== content) {
      editorRef.current.setValue(content);
    }
  }, [content]);

  return <div ref={containerRef} style={{ height: "100%", overflow: "hidden" }} />;
};

export default CodeEditor;
