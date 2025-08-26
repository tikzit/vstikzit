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
  const isUpdatingFromPropRef = useRef(false);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(containerRef.current, {
        // value: content,
        ...editorOptions,
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

  // Change the event listener if the onChange changes
  useEffect(() => {
    if (editorRef.current) {
      const disposable = editorRef.current.onDidChangeModelContent(() => {
        if (!isUpdatingFromPropRef.current) {
          const value = editorRef.current?.getValue();
          onChange(value);
        }
      });
      return () => disposable.dispose();
    }
  }, [onChange]);

  // Update editor content when prop changes
  useEffect(() => {
    if (editorRef.current && editorRef.current.getValue() !== content) {
      isUpdatingFromPropRef.current = true;
      editorRef.current.setValue(content);
      isUpdatingFromPropRef.current = false;
    }
  }, [content]);

  return <div ref={containerRef} style={{ height: "100%", overflow: "hidden" }} />;
};

export default CodeEditor;
