import Editor from "@monaco-editor/react";
import { editorOnMount, editorOptions } from "./editorSetup";

interface CodeEditorProps {
  content: string;
  onChange: (value: string | undefined) => void;
}

const CodeEditor = ({ content, onChange }: CodeEditorProps) => {
  return (
    <div style={{ height: "100%", overflow: "hidden" }}>
      <Editor
        height="100%"
        defaultLanguage="tex"
        value={content}
        onChange={onChange}
        theme="vs"
        loading="Loading TikZ Editor..."
        options={editorOptions}
        onMount={editorOnMount}
      />
    </div>
  );
};

export default CodeEditor;
