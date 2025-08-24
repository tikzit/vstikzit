import { useEffect, useRef } from "react";
import * as monaco from "monaco-editor";
import { editorOptions } from "../lib/editorSetup";

interface CodeEditorProps {
  content: string;
  onChange: (value: string | undefined) => void;
}

const CodeEditor = ({ content, onChange }: CodeEditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        value: content,
        ...editorOptions,
      });

      editorRef.current.onDidChangeModelContent(() => {
        const value = editorRef.current?.getValue();
        onChange(value);
      });
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
