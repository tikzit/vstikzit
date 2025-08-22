import { useEffect, useRef } from "react";
import "monaco-editor/esm/vs/editor/editor.all.js";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { editorOptions } from "../lib/editorSetup";

interface CodeEditorProps {
  content: string;
  onChange: (value: string | undefined) => void;
  onMount: (editor: any, monaco: any) => void;
}

const CodeEditor = ({ content, onChange, onMount }: CodeEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create the editor instance
    const editor = monaco.editor.create(containerRef.current, {
      value: content,
      language: "tex",
      theme: "vs",
      ...editorOptions,
    });

    editorRef.current = editor;

    // Set up the onChange listener
    const disposable = editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      onChange(value);
    });

    // Call the onMount callback
    onMount(editor, monaco);

    // Cleanup function
    return () => {
      disposable.dispose();
      editor.dispose();
    };
  }, [onMount]);

  // Update editor content when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== content) {
      editorRef.current.setValue(content);
    }
  }, [content]);

  return <div ref={containerRef} style={{ height: "100%", overflow: "hidden" }} />;
};

export default CodeEditor;
